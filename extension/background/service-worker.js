// Service worker — auth + product cache + launch queue orchestration.

import {
  getConfig, fetchProduct, apiFetch, logSubmission,
  fetchLaunchStatus, advanceLaunch,
} from '../lib/api.js'

const PRODUCT_CACHE = { data: null, ts: 0 }
const PRODUCT_TTL = 60_000

// Track which tab we opened for the active queue item
// { tabId, sessionId, itemId, directorySlug }
let activeQueueTab = null

async function getProductCached() {
  if (PRODUCT_CACHE.data && Date.now() - PRODUCT_CACHE.ts < PRODUCT_TTL) return PRODUCT_CACHE.data
  const data = await fetchProduct(true)
  PRODUCT_CACHE.data = data
  PRODUCT_CACHE.ts = Date.now()
  return data
}

function notify(title, message, priority = 1) {
  try {
    chrome.notifications?.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title, message, priority,
    })
  } catch {}
}

// Periodic poll for an active launch session
async function pollQueue() {
  try {
    const cfg = await getConfig()
    if (!cfg.token) return
    const status = await fetchLaunchStatus()
    if (!status?.session || !status.active) {
      activeQueueTab = null
      return
    }
    const s = status.session
    const a = status.active
    if (s.status !== 'running') return

    // Already have a tab open for this item?
    if (activeQueueTab && activeQueueTab.itemId === a.itemId) {
      // Verify the tab still exists
      try { await chrome.tabs.get(activeQueueTab.tabId) } catch {
        activeQueueTab = null
      }
    }
    if (activeQueueTab && activeQueueTab.itemId === a.itemId) return

    // Open new tab for this directory
    const tab = await chrome.tabs.create({
      url: a.directory.url,
      active: true,
    })
    activeQueueTab = {
      tabId: tab.id,
      sessionId: s.id,
      itemId: a.itemId,
      directorySlug: a.directory.slug,
    }
    await chrome.storage.local.set({
      directoActiveQueue: {
        sessionId: s.id,
        itemId: a.itemId,
        directorySlug: a.directory.slug,
        directoryName: a.directory.name,
        position: a.position,
        total: s.total,
      },
    })
    notify(
      `🚀 Directo · Step ${a.position + 1} of ${s.total}`,
      `Opening ${a.directory.name} — AI will fill the form. Hit Submit when ready.`,
      2
    )
  } catch (e) {
    // Silent fail — next tick retries
  }
}

// Run poll every 6s via alarm
chrome.alarms.create('directoQueuePoll', { periodInMinutes: 0.1 })
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'directoQueuePoll') pollQueue()
})
// Also poll immediately on install + startup
chrome.runtime.onStartup?.addListener?.(() => pollQueue())
pollQueue()

// Clear queue context if the queue tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeQueueTab && activeQueueTab.tabId === tabId) {
    chrome.storage.local.remove('directoActiveQueue').catch(()=>{})
    activeQueueTab = null
  }
})

// ---- Message router ----
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  ;(async () => {
    try {
      switch (msg.type) {
        case 'PING': {
          const cfg = await getConfig()
          sendResponse({ ok: true, connected: !!cfg.token, base: cfg.base })
          break
        }

        case 'GET_PRODUCT': {
          const cfg = await getConfig()
          if (!cfg.token) { sendResponse({ ok: false, error: 'NOT_CONNECTED' }); break }
          try { sendResponse({ ok: true, product: await getProductCached() }) }
          catch (e) { sendResponse({ ok: false, error: e.message }) }
          break
        }

        case 'GET_QUEUE_CONTEXT': {
          // Content scripts ask: am I part of an active queue?
          const data = await chrome.storage.local.get('directoActiveQueue')
          const ctx = data.directoActiveQueue
          if (!ctx) { sendResponse({ ok: false, active: false }); break }
          // Only mark as active for the tab we opened
          const isQueueTab = activeQueueTab && sender.tab?.id === activeQueueTab.tabId
          sendResponse({ ok: true, active: !!isQueueTab, ctx })
          break
        }

        case 'AI_FILL': {
          try {
            const data = await apiFetch('/api/extension/ai-fill', {
              method: 'POST', body: JSON.stringify(msg.payload),
            })
            sendResponse({ ok: true, ...data })
          } catch (e) { sendResponse({ ok: false, error: e.message }) }
          break
        }

        case 'LOG_SUBMISSION': {
          try { await logSubmission(msg.payload); sendResponse({ ok: true }) }
          catch (e) { sendResponse({ ok: false, error: e.message }) }
          break
        }

        case 'QUEUE_ADVANCE': {
          // payload: { action: 'submitted'|'skipped'|'failed', reason? }
          try {
            if (!activeQueueTab) { sendResponse({ ok: false, error: 'no_active_queue' }); break }
            const res = await advanceLaunch({
              sessionId: activeQueueTab.sessionId,
              itemId: activeQueueTab.itemId,
              action: msg.payload.action,
              reason: msg.payload.reason,
            })
            // Close current tab if requested
            if (msg.payload.closeTab && sender.tab?.id) {
              chrome.tabs.remove(sender.tab.id).catch(()=>{})
            }
            activeQueueTab = null
            await chrome.storage.local.remove('directoActiveQueue')
            // Trigger an immediate poll so next tab opens fast
            setTimeout(() => pollQueue(), 600)
            sendResponse({ ok: true, ...res })
          } catch (e) { sendResponse({ ok: false, error: e.message }) }
          break
        }

        case 'QUEUE_PAUSE': {
          try {
            if (!activeQueueTab) { sendResponse({ ok: false }); break }
            await advanceLaunch({
              sessionId: activeQueueTab.sessionId, itemId: activeQueueTab.itemId,
              action: 'pause', reason: msg.payload?.reason || 'user',
            })
            notify('⏸ Directo paused', msg.payload?.reason === 'login_required'
              ? 'Login to this site, then resume from the Directo dashboard.'
              : msg.payload?.reason === 'captcha'
                ? 'Solve the CAPTCHA, then resume from dashboard.'
                : 'Queue paused. Resume from dashboard when ready.', 2)
            sendResponse({ ok: true })
          } catch (e) { sendResponse({ ok: false, error: e.message }) }
          break
        }

        case 'APPROVAL_DETECTED': {
          try {
            const data = await apiFetch('/api/extension/check-approval', {
              method: 'POST', body: JSON.stringify(msg.payload),
            })
            if (data?.newlyApproved) {
              notify(`🎉 Approved on ${msg.payload.directoryName}!`, 'Directo synced your listing.', 2)
            }
            sendResponse({ ok: true, ...data })
          } catch (e) { sendResponse({ ok: false, error: e.message }) }
          break
        }

        case 'OPEN_POPUP': {
          chrome.tabs.create({ url: chrome.runtime.getURL('popup/index.html') })
          sendResponse({ ok: true })
          break
        }

        default:
          sendResponse({ ok: false, error: 'UNKNOWN_TYPE' })
      }
    } catch (e) {
      sendResponse({ ok: false, error: e.message || String(e) })
    }
  })()
  return true
})

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup/welcome.html') })
  }
})
