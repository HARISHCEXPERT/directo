// Directo overlay — AI autofill + queue-aware orchestration.

;(async function () {
  if (document.getElementById('__directo_overlay')) return

  const dir = window.__directoMatchDirectory(location.href)
  if (!dir) return
  const onSubmit = window.__directoIsSubmitPage(location.href, dir)

  // ---- helpers ----
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
          <span class="__directo_title">${state.queue ? `Queue · ${state.queue.position + 1}/${state.queue.total}` : 'Directo'} · ${escape(dir.name)}</span>
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

  function send(type, payload) {
    return new Promise(resolve => chrome.runtime.sendMessage({ type, payload }, resolve))
  }
  function getProduct()       { return send('GET_PRODUCT') }
  function getQueueCtx()      { return send('GET_QUEUE_CONTEXT') }
  function queueAdvance(p)    { return send('QUEUE_ADVANCE', p) }
  function queuePause(p)      { return send('QUEUE_PAUSE', p) }
  function logSubmission(status, payload = {}) {
    return send('LOG_SUBMISSION', {
      directorySlug: dir.slug, directoryUrl: location.href, status, ...payload,
    })
  }

  // ---- Detect login walls / CAPTCHA ----
  function detectBlocker() {
    const text = (document.body?.innerText || '').toLowerCase().slice(0, 4000)
    if (/sign in|log in|login required|sign up to (continue|submit)|please log in/i.test(text)
        && !window.__directoIsSubmitPage(location.href, dir)) {
      return 'login_required'
    }
    if (document.querySelector('iframe[src*="captcha"], iframe[src*="hcaptcha"], iframe[src*="recaptcha"], div[class*="captcha"]')) {
      return 'captcha'
    }
    return null
  }

  // ---- 1. Connecting ----
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

  // ---- 2. Check if this tab is part of an active queue ----
  const queueRes = await getQueueCtx()
  const isQueueTab = queueRes?.ok && queueRes.active
  const queue = isQueueTab ? queueRes.ctx : null

  // ---- 3. Check blockers BEFORE anything else ----
  setTimeout(async () => {
    const blocker = detectBlocker()
    if (blocker && isQueueTab) {
      // Pause the queue, notify user
      await queuePause({ reason: blocker })
      render({
        product,
        queue,
        warn: blocker === 'login_required'
          ? `🔐 Login required on ${escape(dir.name)}. Log in, then resume from dashboard.`
          : `🤖 CAPTCHA detected. Solve it, then resume from dashboard.`,
        body: `
          <button class="__directo_btn" id="__directo_resumed">I've logged in — continue here</button>
          <button class="__directo_btn __directo_btn_secondary" id="__directo_skip_q">Skip this directory</button>
          <p class="__directo_caption">Queue is paused. After you handle this, continue here OR resume from dashboard.</p>
        `,
      })
      document.getElementById('__directo_resumed').onclick = () => location.reload()
      document.getElementById('__directo_skip_q').onclick = async () => {
        await queueAdvance({ action: 'skipped', reason: blocker, closeTab: true })
      }
      return
    }
  }, 800)

  // ---- 4. Non-submit page handling ----
  if (!onSubmit) {
    if (isQueueTab) {
      // Hint user to navigate to submit
      render({
        product,
        queue,
        body: `
          <div class="__directo_status">
            Open the submit form on ${escape(dir.name)} to continue the queue.
            <br><span class="__directo_dim">Directo will auto-fill it.</span>
          </div>
          <button class="__directo_btn __directo_btn_secondary" id="__directo_skip_q2">Skip this directory</button>
        `,
      })
      document.getElementById('__directo_skip_q2').onclick = async () => {
        await queueAdvance({ action: 'skipped', closeTab: true })
      }
    } else {
      render({
        product,
        body: `<div class="__directo_status">Open the submit form on ${escape(dir.name)} — Directo will auto-fill it.</div>`,
      })
    }
    return
  }

  // ---- 5. Ready state with AI Autofill ----
  function readyState() {
    render({
      product,
      queue,
      body: `
        <button class="__directo_btn" id="__directo_fill">⚡ AI Autofill ${escape(dir.name)} form</button>
        <button class="__directo_btn __directo_btn_secondary" id="__directo_skip">${isQueueTab ? 'Skip this directory' : 'Skip'}</button>
        <p class="__directo_caption">AI reads the form &amp; fills every field smartly. You handle CAPTCHA + submit.</p>
      `,
    })

    document.getElementById('__directo_skip').onclick = async () => {
      if (isQueueTab) await queueAdvance({ action: 'skipped', closeTab: true })
      else { logSubmission('visited'); root.remove() }
    }

    document.getElementById('__directo_fill').onclick = doFill
  }

  // Auto-fire if part of queue, else wait for click
  if (isQueueTab) setTimeout(() => doFill(), 1200)
  readyState()

  async function doFill() {
    render({
      product,
      queue,
      body: `
        <div class="__directo_status">
          <div class="__directo_spinner"></div>
          AI is reading the form and writing perfect content...
        </div>
      `,
    })

    const result = await window.__directoAIFill({
      directorySlug: dir.slug, directoryName: dir.name,
    })

    if (!result.filled || result.filled === 0) {
      render({
        product,
        queue,
        warn: result.error
          ? `AI fill failed: ${escape(result.error)}`
          : `Couldn't fill the form. Please fill manually, or skip.`,
        body: `
          <button class="__directo_btn __directo_btn_secondary" id="__directo_retry">↻ Retry</button>
          ${isQueueTab
            ? `<button class="__directo_btn __directo_btn_secondary" id="__directo_skip3">Skip directory</button>`
            : `<button class="__directo_btn __directo_btn_secondary" id="__directo_close_btn">Close</button>`}
        `,
      })
      document.getElementById('__directo_retry').onclick = () => location.reload()
      const skipBtn = document.getElementById('__directo_skip3')
      if (skipBtn) skipBtn.onclick = async () => {
        await queueAdvance({ action: 'failed', reason: 'fill_failed', closeTab: true })
      }
      const closeBtn = document.getElementById('__directo_close_btn')
      if (closeBtn) closeBtn.onclick = () => root.remove()
      return
    }

    // ---- 6. Filled successfully ----
    render({
      product,
      queue,
      success: `✅ Filled ${result.filled} of ${result.total} fields${result.costUsd ? ` · cost $${result.costUsd.toFixed(3)}` : ''}`,
      body: `
        <div class="__directo_status">
          Review the form, solve CAPTCHA if any, then hit Submit.
          <br><span class="__directo_dim">Watching for confirmation...</span>
        </div>
        <button class="__directo_btn __directo_btn_secondary" id="__directo_done">${isQueueTab ? "I've submitted — next directory" : "I've submitted — mark done"}</button>
        ${isQueueTab ? `<button class="__directo_btn __directo_btn_secondary" id="__directo_skip4">Skip this directory</button>` : ''}
      `,
    })

    document.getElementById('__directo_done').onclick = async () => {
      if (isQueueTab) {
        await queueAdvance({ action: 'submitted', closeTab: true })
      } else {
        logSubmission('submitted', { verified: true, verificationMethod: 'manual_confirm' })
        window.__directoFill.directoToast(`Marked submitted on ${dir.name}`, 'success')
        setTimeout(() => root.remove(), 1100)
      }
    }
    const skip4 = document.getElementById('__directo_skip4')
    if (skip4) skip4.onclick = async () => {
      await queueAdvance({ action: 'skipped', closeTab: true })
    }

    // ---- 7. Auto-detect submission ----
    const initialUrl = location.href
    const initialForm = document.querySelector('form')
    let detected = false
    const detector = setInterval(async () => {
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
        if (isQueueTab) {
          // Auto advance after a brief celebration
          render({
            product,
            queue,
            success: `🎉 Submitted on ${escape(dir.name)}! Moving to next directory...`,
            body: `<div class="__directo_status"><div class="__directo_spinner"></div>Loading next directory...</div>`,
          })
          setTimeout(async () => {
            await queueAdvance({ action: 'submitted', closeTab: true })
          }, 1500)
        } else {
          render({
            product,
            success: `🎉 Submission confirmed on ${escape(dir.name)}!`,
            body: `<button class="__directo_btn __directo_btn_secondary" id="__directo_close2">Close</button>`,
          })
          document.getElementById('__directo_close2').onclick = () => root.remove()
        }
      }
    }, 1800)
    setTimeout(() => clearInterval(detector), 10 * 60 * 1000)
  }
})()
