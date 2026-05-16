// Directo overlay — AI-driven autofill UI.
// Appears on supported directory SUBMIT pages.
// Click → calls AI fill → fills form → watches for submit success.

;(async function () {
  if (document.getElementById('__directo_overlay')) return

  const dir = window.__directoMatchDirectory(location.href)
  if (!dir) return
  const onSubmit = window.__directoIsSubmitPage(location.href, dir)

  // Build container
  const root = document.createElement('div')
  root.id = '__directo_overlay'
  document.body.appendChild(root)

  // -------- helpers --------
  function escape(s) {
    return String(s || '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]))
  }
  function render(state) {
    root.innerHTML = `
      <div class="__directo_header">
        <div class="__directo_brand">
          <div class="__directo_logo">D</div>
          <span class="__directo_title">Directo · ${escape(dir.name)}</span>
        </div>
        <button class="__directo_close" id="__directo_x">×</button>
      </div>
      <div class="__directo_body">
        ${state.warn ? `<div class="__directo_warn">${state.warn}</div>` : ''}
        ${state.success ? `<div class="__directo_success">${state.success}</div>` : ''}
        ${state.product ? `
          <div class="__directo_product">
            <div class="__directo_product_label">Filling for</div>
            <div class="__directo_product_name">${escape(state.product.name || '')}</div>
            <div class="__directo_product_url">${escape(state.product.url || '')}</div>
          </div>` : ''}
        ${state.body || ''}
      </div>
    `
    const close = document.getElementById('__directo_x')
    if (close) close.onclick = () => root.remove()
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

  // -------- 1. Connecting --------
  render({ body: `<div class="__directo_status">Connecting to Directo...</div>` })

  const r = await getProduct()
  if (!r?.ok) {
    render({
      warn: 'Directo not connected. Click the extension icon → paste your token.',
      body: `<button class="__directo_btn" id="__directo_open_popup">Open Directo</button>`,
    })
    document.getElementById('__directo_open_popup').onclick = () =>
      chrome.runtime.sendMessage({ type: 'OPEN_POPUP' })
    return
  }
  const product = r.product

  // -------- 2. Soft hint on non-submit pages --------
  if (!onSubmit) {
    render({
      product,
      body: `<div class="__directo_status">Open the submit form on ${escape(dir.name)} — Directo will auto-fill it.</div>`,
    })
    return
  }

  // -------- 3. Ready state with AI Autofill button --------
  render({
    product,
    body: `
      <button class="__directo_btn" id="__directo_fill">⚡ AI Autofill ${escape(dir.name)} form</button>
      <button class="__directo_btn __directo_btn_secondary" id="__directo_skip">Skip</button>
      <p class="__directo_caption">AI reads the form &amp; fills every field smartly. You handle CAPTCHA + submit.</p>
    `,
  })

  document.getElementById('__directo_skip').onclick = () => {
    logSubmission('visited', { verified: false, verificationMethod: 'none' })
    root.remove()
  }

  document.getElementById('__directo_fill').onclick = async () => {
    // -------- 4. Filling --------
    render({
      product,
      body: `
        <div class="__directo_status">
          <div class="__directo_spinner"></div>
          AI is reading the form and writing perfect content...
        </div>
      `,
    })

    const result = await window.__directoAIFill({
      directorySlug: dir.slug,
      directoryName: dir.name,
    })

    if (!result.filled || result.filled === 0) {
      render({
        product,
        warn: result.error
          ? `AI fill failed: ${escape(result.error)}`
          : `Couldn't fill the form. The directory may have an unusual layout — please fill manually.`,
        body: `
          <button class="__directo_btn __directo_btn_secondary" id="__directo_retry">↻ Retry</button>
          <button class="__directo_btn __directo_btn_secondary" id="__directo_close_btn">Close</button>
        `,
      })
      document.getElementById('__directo_retry').onclick = () => location.reload()
      document.getElementById('__directo_close_btn').onclick = () => root.remove()
      return
    }

    // -------- 5. Filled successfully — watch for submission --------
    render({
      product,
      success: `✅ Filled ${result.filled} of ${result.total} fields${result.costUsd ? ` · cost $${result.costUsd.toFixed(3)}` : ''}`,
      body: `
        <div class="__directo_status">
          Review the form, solve CAPTCHA if any, then hit Submit.
          <br><span class="__directo_dim">Watching for confirmation...</span>
        </div>
        <button class="__directo_btn __directo_btn_secondary" id="__directo_done">I've submitted — mark done</button>
      `,
    })

    document.getElementById('__directo_done').onclick = () => {
      logSubmission('submitted', {
        verified: true,
        verificationMethod: 'manual_confirm',
      })
      window.__directoFill.directoToast(`Marked submitted on ${dir.name}`, 'success')
      setTimeout(() => root.remove(), 1200)
    }

    // -------- 6. Auto-detect submission --------
    const initialUrl = location.href
    const initialForm = document.querySelector('form')
    let detected = false
    const detector = setInterval(() => {
      if (detected) { clearInterval(detector); return }
      const urlChanged = location.href !== initialUrl
      const formGone = initialForm && !document.body.contains(initialForm)
      const successText = /thank you|received|in queue|under review|pending review|submitted|moderation/i.test(
        document.body?.innerText?.slice(0, 4000) || ''
      )
      const stillOnSubmit = window.__directoIsSubmitPage(location.href, dir)

      if ((urlChanged && !stillOnSubmit) || (formGone && successText) || (successText && !stillOnSubmit)) {
        detected = true
        clearInterval(detector)
        logSubmission('submitted', {
          verified: true,
          verificationMethod: urlChanged ? 'success_url' : 'success_text',
          successUrl: location.href,
        })
        render({
          product,
          success: `🎉 Submission confirmed on ${escape(dir.name)}!`,
          body: `<button class="__directo_btn __directo_btn_secondary" id="__directo_close2">Close</button>`,
        })
        document.getElementById('__directo_close2').onclick = () => root.remove()
      }
    }, 1800)

    // Stop watching after 10 min
    setTimeout(() => clearInterval(detector), 10 * 60 * 1000)
  }
})()
