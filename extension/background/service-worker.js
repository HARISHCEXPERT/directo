// Service worker — auth state, product cache, message bus between content/popup.

import { getConfig, fetchProduct, apiFetch, logSubmission } from '../lib/api.js'

// Message router
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
          try {
            const product = await fetchProduct()
            sendResponse({ ok: true, product })
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
        case 'OPEN_POPUP': {
          // Best-effort — Chrome doesn't let extensions open their own popup from content
          // but we can open the popup HTML in a new tab as fallback
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
  return true // keep channel open for async sendResponse
})

// On install — open welcome page
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup/welcome.html') })
  }
})
