// Floating overlay — now with REAL submission verification.
// After autofill, listens for success signals before marking as "submitted".

;(async function () {
  if (document.getElementById('__directo_overlay')) return

  const dir = window.__directoMatchDirectory(location.href)
  if (!dir) return
  const onSubmit = window.__directoMatchSubmitPage(location.href)

  // Build overlay
  const root = document.createElement('div')
  root.id = '__directo_overlay'
  document.body.appendChild(root)

  function escape(s) {
    return String(s || '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]))
  }

  function render(state) {
    root.innerHTML = `
      <div class="__directo_header">
        <div class="__directo_brand">
          <div class="__directo_logo">D</div>
          <span class="__directo_title">Directo · ${dir.name}</span>
        </div>
        <button class="__directo_close" id="__directo_x">×</button>
      </div>
      <div class="__directo_body">
        ${state.warn ? `<div class="__directo_warn">${state.warn}</div>` : ''}
        ${state.success ? `<div class="__directo_success">${state.success}</div>` : ''}
        ${state.product ? `
          <div class="__directo_product">
            <div class="__directo_product_label">Filling for</div>
            <div class="__directo_product_name">${escape(state.product.name)}</div>
            <div class="__directo_product_url">${escape(state.product.url)}</div>
          </div>` : ''}
        ${state.action || ''}
      </div>
    `
    const close = document.getElementById('__directo_x')
    if (close) close.onclick = () => root.remove()
  }

  function ask(message) {
    return new Promise(resolve => {
      // simple inline confirm
      const m = window.__directoFill.directoToast
      const ok = window.confirm(message)
      resolve(ok)
    })
  }

  function getProduct() {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ type: 'GET_PRODUCT' }, resolve)
    })
  }

  function logSubmission(status, payload = {}) {
    chrome.runtime.sendMessage({
      type: 'LOG_SUBMISSION',
      payload: {
        directorySlug: dir.slug,
        directoryUrl: location.href,
        status,
        ...payload,
      },
    })
  }

  render({ action: `<div class="__directo_status">Connecting to Directo...</div>` })

  const res = await getProduct()

  if (!res?.ok) {
    render({
      warn: 'Directo not connected. Click the extension icon → paste your token.',
      action: `<button class="__directo_btn" id="__directo_open_popup">Open Directo extension</button>`,
    })
    document.getElementById('__directo_open_popup').onclick = () => {
      chrome.runtime.sendMessage({ type: 'OPEN_POPUP' })
    }
    return
  }

  const product = res.product

  if (!onSubmit) {
    render({
      product,
      action: `<div class="__directo_status">Open the submit form on ${dir.name} — I'll autofill it.</div>`,
    })
    return
  }

  // === Autofill stage ===
  render({
    product,
    action: `
      <button class="__directo_btn" id="__directo_fill">⚡ Autofill ${dir.name} form</button>
      <button class="__directo_btn __directo_btn_secondary" id="__directo_skip">Skip</button>
    `,
  })

  document.getElementById('__directo_fill').onclick = async () => {
    const filler = window.__directoFillers?.[dir.slug]
    if (!filler) {
      window.__directoFill.directoToast(`No filler for ${dir.name} yet`, 'error')
      return
    }
    const count = filler(product)
    if (count === 0) return

    // After fill — switch to verification mode
    render({
      product,
      action: `
        <div class="__directo_status">
          ✅ ${count} fields filled.<br>
          <span style="color:#a78bfa">Watching for submit confirmation...</span>
        </div>
        <button class="__directo_btn __directo_btn_secondary" id="__directo_giveup">Stop watching</button>
      `,
    })

    let abortFn = null
    const result = await window.__directoWatchSuccess(dir.slug, {
      onAbort: (a) => { abortFn = a }
    })
    document.getElementById('__directo_giveup')?.addEventListener('click', () => {
      if (abortFn) abortFn()
    })

    if (result) {
      // VERIFIED submission!
      logSubmission('submitted', {
        verified: true,
        verificationMethod: result.method,
        successUrl: result.url,
      })
      render({
        product,
        success: `🎉 Submission confirmed on ${dir.name}! Synced to Directo.`,
        action: `<button class="__directo_btn __directo_btn_secondary" id="__directo_close2">Close</button>`,
      })
      document.getElementById('__directo_close2').onclick = () => root.remove()
    } else {
      // Couldn't auto-detect — ask user
      render({
        product,
        warn: `Couldn't auto-detect submission on ${dir.name}. Did you successfully submit?`,
        action: `
          <button class="__directo_btn" id="__directo_yes">✓ Yes, I submitted</button>
          <button class="__directo_btn __directo_btn_secondary" id="__directo_no">No, not yet</button>
        `,
      })
      document.getElementById('__directo_yes').onclick = () => {
        logSubmission('submitted', { verified: true, verificationMethod: 'manual_confirm' })
        window.__directoFill.directoToast(`Marked as submitted on ${dir.name}`, 'success')
        setTimeout(() => root.remove(), 1500)
      }
      document.getElementById('__directo_no').onclick = () => {
        logSubmission('visited', { verified: false, verificationMethod: 'none' })
        root.remove()
      }
    }
  }

  document.getElementById('__directo_skip').onclick = () => {
    logSubmission('visited', { verified: false, verificationMethod: 'none' })
    root.remove()
  }
})()
