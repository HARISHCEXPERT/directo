// Passive approval detector.
// Runs on EVERY page load (within configured directory hosts).
// If the page looks like the user's product listing → mark as APPROVED.

;(async function () {
  const dir = window.__directoMatchDirectory(location.href)
  if (!dir) return

  // Don't run on submit pages — only on listing/detail pages
  if (window.__directoIsSubmitPage(location.href, dir)) return

  // Get product info from background (cached, fast)
  let product
  try {
    const res = await new Promise(resolve => {
      chrome.runtime.sendMessage({ type: 'GET_PRODUCT' }, resolve)
    })
    if (!res?.ok) return
    product = res.product
  } catch { return }
  if (!product?.name) return

  // Run AFTER initial paint to let SPA frameworks render
  setTimeout(runDetection, 1500)

  function runDetection() {
    const signals = []
    const productName = (product.name || '').toLowerCase().trim()
    if (!productName) return

    // Signal 1: URL slug match
    const slug = productName.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const path = location.pathname.toLowerCase()
    if (slug.length >= 3 && (path.includes(`/${slug}`) || path.endsWith(`/${slug}/`))) {
      signals.push('url_slug')
    }

    // Signal 2: H1 / page title contains product name
    const h1 = document.querySelector('h1')?.textContent || ''
    if (h1.toLowerCase().includes(productName)) signals.push('h1_match')

    const title = document.title || ''
    if (title.toLowerCase().includes(productName)) signals.push('title_match')

    // Signal 3: Outbound link to product URL
    if (product.url) {
      try {
        const productHost = new URL(product.url).hostname.replace(/^www\./, '').toLowerCase()
        if (productHost && productHost.length > 4) {
          const links = document.querySelectorAll('a[href*="' + productHost + '"]')
          if (links.length > 0) signals.push('outbound_link')
        }
      } catch {}
    }

    // Require 2+ signals (avoid false positives on search/listing pages)
    if (signals.length < 2) return

    // Confidence boost: if URL slug + outbound link both present → very high confidence
    const isHighConfidence = signals.includes('url_slug') && signals.includes('outbound_link')

    chrome.runtime.sendMessage({
      type: 'APPROVAL_DETECTED',
      payload: {
        directorySlug: dir.slug,
        directoryName: dir.name,
        listingUrl: location.href,
        signals,
        confidence: isHighConfidence ? 'high' : 'medium',
      },
    }, (res) => {
      // Show celebration toast if backend confirms first-time approval
      if (res?.ok && res?.newlyApproved) {
        showApprovalToast(dir.name)
      }
    })
  }

  function showApprovalToast(directoryName) {
    const el = document.createElement('div')
    el.id = '__directo_approval_toast'
    el.innerHTML = `
      <div class="__directo_appr_inner">
        <div class="__directo_appr_emoji">🎉</div>
        <div>
          <div class="__directo_appr_title">Approved on ${escape(directoryName)}!</div>
          <div class="__directo_appr_sub">Directo tracked your listing.</div>
        </div>
      </div>
    `
    document.body.appendChild(el)
    setTimeout(() => el.classList.add('__directo_appr_show'), 10)
    setTimeout(() => {
      el.classList.remove('__directo_appr_show')
      setTimeout(() => el.remove(), 400)
    }, 6000)
  }

  function escape(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]))
  }
})()
