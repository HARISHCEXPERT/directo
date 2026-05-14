// Success detection per directory.
// After autofill + user clicks Submit, we watch for these signals:
//   1. URL pattern change (e.g. /posts/new → /posts/<slug>)
//   2. Page contains success text ("thank you", "submitted", "received", etc.)
//   3. The submit form itself disappears
//
// Only when one of these fires do we mark the submission as VERIFIED.

window.__directoSuccessDetectors = {
  producthunt: {
    // After successful post, URL becomes /posts/<slug> (no /new)
    successUrl: /producthunt\.com\/posts\/[a-z0-9-]+(\/?$|\?)/,
    submitUrl: /producthunt\.com\/posts\/new/,
    successText: /(thank you|your post|submitted|under review|in queue|pending review|received your submission)/i,
  },
  betalist: {
    successUrl: /betalist\.com\/(startups\/[a-z0-9-]+|submit\/success|thank|confirmation)/,
    submitUrl: /betalist\.com\/(submit|startups\/new)/,
    successText: /(thank you|submission received|we'll review|received your|under review|in queue)/i,
  },
  saashub: {
    successUrl: /saashub\.com\/(thank|submitted|software\/[a-z0-9-]+)/,
    submitUrl: /saashub\.com\/(submit|software\/new)/,
    successText: /(thank you|submission received|we will review|under review|pending)/i,
  },
  alternativeto: {
    successUrl: /alternativeto\.net\/(thank|submitted|software\/[a-z0-9-]+)/,
    submitUrl: /alternativeto\.net\/(submit|new-app)/,
    successText: /(thank you|app submitted|we'll review|under review|moderation)/i,
  },
  indiehackers: {
    successUrl: /indiehackers\.com\/(post\/[a-z0-9-]+|products\/[a-z0-9-]+|thank)/,
    submitUrl: /indiehackers\.com\/(new-post|products\/new)/,
    successText: /(posted|published|thank you|your post is live)/i,
  },
  uneed: {
    successUrl: /uneed\.best\/(thank|submitted|tool\/[a-z0-9-]+)/,
    submitUrl: /uneed\.best\/(submit|new)/,
    successText: /(thank you|submitted|received|under review)/i,
  },
  toolify: {
    successUrl: /toolify\.ai\/(thank|submitted|success|tool\/[a-z0-9-]+)/,
    submitUrl: /toolify\.ai\/(submit|new)/,
    successText: /(thank you|submitted|received|under review|pending)/i,
  },
  taaft: {
    successUrl: /theresanaiforthat\.com\/(thank|submitted|ai\/[a-z0-9-]+)/,
    submitUrl: /theresanaiforthat\.com\/(submit|add)/,
    successText: /(thank you|submitted|received|under review)/i,
  },
}

// Watch for success signals. Resolves with { method, url } when detected,
// or null if timeout/abort.
window.__directoWatchSuccess = function watchSuccess(directorySlug, opts = {}) {
  const detector = window.__directoSuccessDetectors[directorySlug]
  if (!detector) return Promise.resolve(null)

  const timeoutMs = opts.timeoutMs ?? 5 * 60 * 1000 // 5 min window
  let initialUrl = location.href
  let initialForm = document.querySelector('form')
  let abort = false

  return new Promise(resolve => {
    const t0 = Date.now()

    const tick = () => {
      if (abort || Date.now() - t0 > timeoutMs) {
        clearInterval(interval)
        resolve(null)
        return
      }

      // Signal 1: URL changed AND matches success pattern
      if (location.href !== initialUrl) {
        const isSubmitStill = detector.submitUrl.test(location.href)
        const isSuccessUrl = detector.successUrl?.test(location.href)
        if (!isSubmitStill && isSuccessUrl) {
          clearInterval(interval)
          resolve({ method: 'success_url', url: location.href })
          return
        }
      }

      // Signal 2: Page text contains success phrase (AND not still on submit form)
      if (detector.successText) {
        const onSubmit = detector.submitUrl.test(location.href)
        if (!onSubmit) {
          const text = (document.body?.innerText || '').slice(0, 5000)
          if (detector.successText.test(text)) {
            clearInterval(interval)
            resolve({ method: 'success_text', url: location.href })
            return
          }
        }
      }

      // Signal 3: original form disappeared (rough — works on multi-step too)
      if (initialForm && !document.body.contains(initialForm)) {
        // Only count this if URL also shifted
        if (location.href !== initialUrl) {
          clearInterval(interval)
          resolve({ method: 'form_gone', url: location.href })
          return
        }
      }
    }

    const interval = setInterval(tick, 1500)

    // Expose abort for caller
    opts.onAbort?.(() => { abort = true; clearInterval(interval); resolve(null) })
  })
}
