// Directo overlay — AI-driven autofill UI.
// Appears on supported directory SUBMIT pages.
// Supports multi-step forms via MutationObserver.

;(async function () {
  if (document.getElementById('__directo_overlay')) return

  const dir = window.__directoMatchDirectory(location.href)
  if (!dir) return
  const onSubmit = window.__directoIsSubmitPage(location.href, dir)

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
    if (close) close.onclick = () => {
      if (activeObserver) activeObserver.disconnect()
      root.remove()
    }
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

  let activeObserver = null
  let totalFilled = 0
  let currentStep = 1
  let isFilling = false

  // Multi-step watcher
  async function watchForNewFields(product) {
    let lastFieldCount = document.querySelectorAll('input:not([type=hidden]):not([type=password]), textarea, select').length

    if (activeObserver) activeObserver.disconnect()

    activeObserver = new MutationObserver(async () => {
      if (isFilling) return

      const currentFieldCount = document.querySelectorAll('input:not([type=hidden]):not([type=password]), textarea, select').length

      if (currentFieldCount !== lastFieldCount && currentFieldCount > 0) {
        lastFieldCount = currentFieldCount
        currentStep++

        // Wait for DOM to settle
        await new Promise(r => setTimeout(r, 800))

        isFilling = true

        render({
          product,
          success: `✅ Step ${currentStep - 1} done · ${totalFilled} fields filled`,
          body: `
            <div class="__directo_status">
              <div class="__directo_spinner"></div>
              AI filling step ${currentStep}...
            </div>
          `,
        })

        const result = await window.__directoAIFill({
          directorySlug: dir.slug,
          directoryName: dir.name,
        })

        isFilling = false

        if (result.filled > 0) {
          totalFilled += result.filled
          window.__directoFill?.directoToast(`⚡ Step ${currentStep}: filled ${result.filled} fields`, 'success')

          render({
            product,
            success: `✅ ${totalFilled} fields filled across ${currentStep} steps`,
            body: `
              <div class="__directo_status">
                Watching for next step...
                <br><span class="__directo_dim">Review fields, then click Next/Continue.</span>
              </div>
              <button class="__directo_btn __directo_btn_secondary" id="__directo_done">I've submitted — mark done</button>
            `,
          })

          document.getElementById('__directo_done')?.addEventListener('click', () => {
            logSubmission('submitted', {
              verified: true,
              verificationMethod: 'manual_confirm',
            })
            if (activeObserver) activeObserver.disconnect()
            window.__directoFill?.directoToast(`Marked submitted on ${dir.name}`, 'success')
            setTimeout(() => root.remove(), 1200)
          })
        }
      }
    })

    activeObserver.observe(document.body, {
      childList: true,
      subtree: true,
    })

    // Stop after 15 min
    setTimeout(() => {
      if (activeObserver) activeObserver.disconnect()
    }, 15 * 60 * 1000)
  }

  // Auto-detect submission success
  function watchForSuccess(product) {
    const initialUrl = location.href
    const initialForm = document.querySelector('form')
    let detected = false

    const detector = setInterval(() => {
      if (detected) { clearInterval(detector); return }

      const urlChanged = location.href !== initialUrl
      const formGone = initialForm && !document.body.contains(initialForm)
      const successText = /thank you|received|in queue|under review|pending review|submitted|moderation|success/i.test(
        document.body?.innerText?.slice(0, 4000) || ''
      )
      const stillOnSubmit = window.__directoIsSubmitPage(location.href, dir)

      if ((urlChanged && !stillOnSubmit) || (formGone && successText) || (successText && !stillOnSubmit)) {
        detected = true
        clearInterval(detector)
        if (activeObserver) activeObserver.disconnect()

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
        document.getElementById('__directo_close2')?.onclick = () => root.remove()
      }
    }, 1800)

    setTimeout(() => clearInterval(detector), 10 * 60 * 1000)
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

  // -------- 2. Non-submit page --------
  if (!onSubmit) {
    render({
      product,
      body: `<div class="__directo_status">Open the submit form on ${escape(dir.name)} — Directo will auto-fill it.</div>`,
    })
    return
  }

  // -------- 3. Ready state --------
  render({
    product,
    body: `
      <button class="__directo_btn" id="__directo_fill">⚡ AI Autofill ${escape(dir.name)} form</button>
      <button class="__directo_btn __directo_btn_secondary" id="__directo_skip">Skip</button>
      <p class="__directo_caption">AI reads every step &amp; fills automatically. You handle CAPTCHA + submit.</p>
    `,
  })

  document.getElementById('__directo_skip').onclick = () => {
    logSubmission('visited', { verified: false, verificationMethod: 'none' })
    if (activeObserver) activeObserver.disconnect()
    root.remove()
  }

  document.getElementById('__directo_fill').onclick = async () => {
    // -------- 4. Filling step 1 --------
    render({
      product,
      body: `
        <div class="__directo_status">
          <div class="__directo_spinner"></div>
          AI is reading step 1 and filling fields...
        </div>
      `,
    })

    isFilling = true
    const result = await window.__directoAIFill({
      directorySlug: dir.slug,
      directoryName: dir.name,
    })
    isFilling = false

    if (!result.filled || result.filled === 0) {
      render({
        product,
        warn: result.error
          ? `AI fill failed: ${escape(result.error)}`
          : `Couldn't fill the form. Please fill manually.`,
        body: `
          <button class="__directo_btn __directo_btn_secondary" id="__directo_retry">↻ Retry</button>
          <button class="__directo_btn __directo_btn_secondary" id="__directo_close_btn">Close</button>
        `,
      })
      document.getElementById('__directo_retry').onclick = () => location.reload()
      document.getElementById('__directo_close_btn').onclick = () => root.remove()
      return
    }

    totalFilled = result.filled

    // -------- 5. Step 1 filled — start multi-step watcher --------
    render({
      product,
      success: `✅ Step 1: filled ${result.filled} of ${result.total} fields${result.costUsd ? ` · $${result.costUsd.toFixed(3)}` : ''}`,
      body: `
        <div class="__directo_status">
          Watching for next step automatically...
          <br><span class="__directo_dim">Click Next/Continue — AI fills each step.</span>
        </div>
        <button class="__directo_btn __directo_btn_secondary" id="__directo_done">I've submitted — mark done</button>
      `,
    })

    document.getElementById('__directo_done').onclick = () => {
      logSubmission('submitted', {
        verified: true,
        verificationMethod: 'manual_confirm',
      })
      if (activeObserver) activeObserver.disconnect()
      window.__directoFill?.directoToast(`Marked submitted on ${dir.name}`, 'success')
      setTimeout(() => root.remove(), 1200)
    }

    // Start watchers
    await watchForNewFields(product)
    watchForSuccess(product)
  }
})()