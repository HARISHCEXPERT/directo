// Service worker — auth, product cache, message bus for content + popup.

import { getConfig, fetchProduct, apiFetch, logSubmission } from '../lib/api.js'

const PRODUCT_CACHE = { data: null, ts: 0 }
const PRODUCT_TTL = 60_000 // 1 min

async function getProductCached() {
  if (PRODUCT_CACHE.data && Date.now() - PRODUCT_CACHE.ts < PRODUCT_TTL) {
    return PRODUCT_CACHE.data
  }
  const data = await fetchProduct(true)
  PRODUCT_CACHE.data = data
  PRODUCT_CACHE.ts = Date.now()
  return data
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
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
          try {
            const product = await getProductCached()
            sendResponse({ ok: true, product })
          } catch (e) {
            sendResponse({ ok: false, error: e.message })
          }
          break
        }

        case 'AI_FILL': {
          try {
            const data = await apiFetch('/api/extension/ai-fill', {
              method: 'POST',
              body: JSON.stringify(msg.payload),
            })
            sendResponse({ ok: true, ...data })
          } catch (e) {
            sendResponse({ ok: false, error: e.message })
          }
          break
        }

        case 'LOG_SUBMISSION': {
          try {
            await logSubmission(msg.payload)
            sendResponse({ ok: true })
          } catch (e) {
            sendResponse({ ok: false, error: e.message })
          }
          break
        }

        case 'APPROVAL_DETECTED': {
          try {
            const data = await apiFetch('/api/extension/check-approval', {
              method: 'POST',
              body: JSON.stringify(msg.payload),
            })
            // If backend confirms first-time approval, show OS notification
            if (data?.newlyApproved) {
              chrome.notifications?.create({
                type: 'basic',
                iconUrl: chrome.runtime.getURL('icons/icon128.png'),
                title: `🎉 Approved on ${msg.payload.directoryName}!`,
                message: 'Directo synced your listing.',
                priority: 2,
              })
            }
            sendResponse({ ok: true, ...data })
          } catch (e) {
            sendResponse({ ok: false, error: e.message })
          }
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
