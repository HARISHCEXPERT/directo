// Directo overlay — AI autofill + multi-step orchestration + queue mode.
// Loop: scan → AI fill → click Next → wait for step change → repeat → stop on Submit.

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
          <span class="__directo_title">${state.queue ? `Queue · ${state.queue.position + 1}/${state.queue.total}` : 'Directo'}${state.step ? ` · Step ${state.step}` : ''} · ${escape(dir.name)}</span>
        </div>
        <button class="__directo_close" id="__directo_x">×</button>
      </div>
      <div class="__directo_body">
        ${state.warn    ? `<div class="__directo_warn">${state.warn}</div>` : ''}
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
  const getProduct  = () => send('GET_PRODUCT')
  const getQueueCtx = () => send('GET_QUEUE_CONTEXT')
  const queueAdvance = p => send('QUEUE_ADVANCE', p)
  const queuePause   = p => send('QUEUE_PAUSE', p)
  const logSubmission = (status, payload = {}) =>
    send('LOG_SUBMISSION', { directorySlug: dir.slug, directoryUrl: location.href, status, ...payload })

  function detectBlocker() {
    const text = (document.body?.innerText || '').toLowerCase().slice(0, 4000)
    if (/sign in to (continue|submit)|log in to (continue|submit)|please (log|sign) in|login required/i.test(text)
        && !window.__directoIsSubmitPage(location.href, dir)) {
      return 'login_required'
    }
    if (document.querySelector('iframe[src*="captcha"], iframe[src*="hcaptcha"], iframe[src*="recaptcha"], div[class*="captcha"]')) {
      return 'captcha'
    }
    return null
  }

  // Wait for the form step to change. Polls signature + URL. Resolves when either changes,
  // or rejects on timeout.
  function waitForStepChange(prevSig, timeoutMs = 8000) {
    return new Promise(resolve => {
      const start = Date.now()
      const t = setInterval(() => {
        const nowSig = window.__directoFormSignature()
        const changed = nowSig !== prevSig && nowSig.length > 0
        if (changed) { clearInterval(t); resolve({ changed: true, sig: nowSig }) ; return }
        if (Date.now() - start > timeoutMs) { clearInterval(t); resolve({ changed: false, sig: nowSig }); return }
      }, 600)
    })
  }

  // ----- 1. Connecting -----
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

  const queueRes = await getQueueCtx()
  const isQueueTab = queueRes?.ok && queueRes.active
  const queue = isQueueTab ? queueRes.ctx : null

  // Detect blockers after small delay
  setTimeout(async () => {
    const blocker = detectBlocker()
    if (blocker && isQueueTab) {
      await queuePause({ reason: blocker })
      render({
        product, queue,
        warn: blocker === 'login_required'
          ? `🔐 Login required on ${escape(dir.name)}. Log in then click below to continue.`
          : `🤖 CAPTCHA detected. Solve it, then click below to continue.`,
        body: `
          <button class="__directo_btn" id="__directo_resumed">I'm ready — continue</button>
          <button class="__directo_btn __directo_btn_secondary" id="__directo_skip_q">Skip this directory</button>
        `,
      })
      document.getElementById('__directo_resumed').onclick = () => location.reload()
      document.getElementById('__directo_skip_q').onclick = () =>
        queueAdvance({ action: 'skipped', reason: blocker, closeTab: true })
      return
    }
  }, 1000)

  // ----- 2. Non-submit page (in queue) — hint user to navigate -----
  if (!onSubmit) {
    render({
      product, queue,
      body: `
        <div class="__directo_status">Open the submit form on ${escape(dir.name)} — Directo will auto-fill it.</div>
        ${isQueueTab ? `<button class="__directo_btn __directo_btn_secondary" id="__directo_skip_q2">Skip this directory</button>` : ''}
      `,
    })
    const sk = document.getElementById('__directo_skip_q2')
    if (sk) sk.onclick = () => queueAdvance({ action: 'skipped', closeTab: true })
    return
  }

  // ----- 3. READY state -----
  function readyState() {
    render({
      product, queue,
      body: `
        <button class="__directo_btn" id="__directo_fill">⚡ AI Autofill ${escape(dir.name)}</button>
        <button class="__directo_btn __directo_btn_secondary" id="__directo_skip">${isQueueTab ? 'Skip this directory' : 'Skip'}</button>
        <p class="__directo_caption">AI fills multi-step forms automatically. You handle CAPTCHA + final Submit.</p>
      `,
    })
    document.getElementById('__directo_skip').onclick = () => {
      if (isQueueTab) queueAdvance({ action: 'skipped', closeTab: true })
      else { logSubmission('visited'); root.remove() }
    }
    document.getElementById('__directo_fill').onclick = startFillLoop
  }
  readyState()

  // Auto-fire in queue mode
  if (isQueueTab) setTimeout(() => startFillLoop(), 1500)

  // ----- 4. MULTI-STEP FILL LOOP -----
  async function startFillLoop() {
    let step = 1
    let totalFilled = 0
    let totalCost = 0
    const MAX_STEPS = 8

    while (step <= MAX_STEPS) {
      // 4a. Fill current step
      render({
        product, queue, step,
        body: `<div class="__directo_status">
          <div class="__directo_spinner"></div>
          AI is filling step ${step}...
        </div>`,
      })

      const fields = window.__directoScanForm()
      if (!fields || fields.length === 0) {
        if (step === 1) {
          render({
            product, queue,
            warn: `No fields detected on this page. Form may not have loaded yet.`,
            body: `
              <button class="__directo_btn __directo_btn_secondary" id="__directo_retry">↻ Retry</button>
              ${isQueueTab ? `<button class="__directo_btn __directo_btn_secondary" id="__directo_skip_x">Skip</button>` : ''}
            `,
          })
          document.getElementById('__directo_retry').onclick = () => location.reload()
          const sk = document.getElementById('__directo_skip_x')
          if (sk) sk.onclick = () => queueAdvance({ action: 'skipped', closeTab: true })
          return
        }
        // No new fields after a step click — probably we're past the form. Treat as final.
        break
      }

      const result = await window.__directoAIFill({
        directorySlug: dir.slug, directoryName: dir.name, step,
      })

      if (!result.filled || result.filled === 0) {
        render({
          product, queue, step,
          warn: result.error ? `AI fill error: ${escape(result.error)}` : `Couldn't fill this step. Try manually.`,
          body: `
            <button class="__directo_btn __directo_btn_secondary" id="__directo_retry2">↻ Retry</button>
            ${isQueueTab ? `<button class="__directo_btn __directo_btn_secondary" id="__directo_skip4">Skip</button>` : ''}
          `,
        })
        document.getElementById('__directo_retry2').onclick = () => location.reload()
        const sk = document.getElementById('__directo_skip4')
        if (sk) sk.onclick = () => queueAdvance({ action: 'failed', reason: 'fill_failed', closeTab: true })
        return
      }

      totalFilled += result.filled
      totalCost += result.costUsd || 0

      // 4b. Look for action button
      const prevSig = window.__directoFormSignature()
      const btn = window.__directoFindActionButton()

      if (!btn) {
        // No clear next/submit button — assume user will navigate manually
        finalState({ step, totalFilled, totalCost, manualReason: 'no_button' })
        return
      }

      if (btn.kind === 'submit') {
        // FINAL STEP — stop here, user clicks Submit
        finalState({ step, totalFilled, totalCost, btn })
        return
      }

      // 4c. Auto-click Next
      render({
        product, queue, step,
        success: `✅ Step ${step} filled (${result.filled} fields). Clicking "${escape(btn.text)}"...`,
        body: `<div class="__directo_status">Advancing to step ${step + 1}...</div>`,
      })
      try { btn.el.click() } catch {}

      // 4d. Wait for the step to change
      const waitResult = await waitForStepChange(prevSig, 9000)
      if (!waitResult.changed) {
        // Step didn't advance — maybe validation error, or page didn't transition
        render({
          product, queue, step,
          warn: `Step ${step} didn't advance. There may be a validation error or required field.`,
          body: `
            <button class="__directo_btn" id="__directo_retry_step">↻ Retry this step</button>
            <button class="__directo_btn __directo_btn_secondary" id="__directo_done_anyway">I'll finish manually</button>
          `,
        })
        document.getElementById('__directo_retry_step').onclick = startFillLoop
        document.getElementById('__directo_done_anyway').onclick = () => finalState({ step, totalFilled, totalCost, manualReason: 'validation' })
        return
      }

      step++
      // Continue loop into next step
    }

    // Hit MAX_STEPS safety stop
    finalState({ step: step - 1, totalFilled, totalCost, manualReason: 'max_steps' })
  }

  // ----- 5. FINAL state — user submits, we watch for confirmation -----
  function finalState({ step, totalFilled, totalCost, btn, manualReason }) {
    const submitLabel = btn ? escape(btn.text) : 'Submit'
    const note = manualReason === 'no_button'
      ? `No submit button found — please finish manually.`
      : manualReason === 'validation'
        ? `Looks like a validation issue. Fix the highlighted field and continue.`
        : manualReason === 'max_steps'
          ? `Filled ${step} steps. Continue manually if more.`
          : `All ${step} step(s) filled · $${totalCost.toFixed(3)}`

    render({
      product, queue,
      success: `✅ ${totalFilled} fields filled across ${step} step(s)${totalCost ? ` · cost $${totalCost.toFixed(3)}` : ''}`,
      body: `
        <div class="__directo_status">${escape(note)}<br>
          <span class="__directo_dim">Click "${submitLabel}" yourself · Directo will detect success</span>
        </div>
        <button class="__directo_btn __directo_btn_secondary" id="__directo_done">${isQueueTab ? "I submitted — next directory" : "I submitted — mark done"}</button>
        ${isQueueTab ? `<button class="__directo_btn __directo_btn_secondary" id="__directo_skip_final">Skip this directory</button>` : ''}
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
    const skipFinal = document.getElementById('__directo_skip_final')
    if (skipFinal) skipFinal.onclick = () => queueAdvance({ action: 'skipped', closeTab: true })

    // Watch for actual submission
    const initialUrl = location.href
    const initialForm = document.querySelector('form')
    let detected = false
    const detector = setInterval(async () => {
      if (detected) { clearInterval(detector); return }
      const urlChanged = location.href !== initialUrl
      const formGone = initialForm && !document.body.contains(initialForm)
      const text = (document.body?.innerText || '').slice(0, 4000)
      const successText = /thank you|received your|in queue|under review|pending review|submitted|moderation|will review|your submission/i.test(text)
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
          render({
            product, queue,
            success: `🎉 Submitted on ${escape(dir.name)}! Moving to next...`,
            body: `<div class="__directo_status"><div class="__directo_spinner"></div>Loading next directory...</div>`,
          })
          setTimeout(() => queueAdvance({ action: 'submitted', closeTab: true }), 1500)
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
    setTimeout(() => clearInterval(detector), 12 * 60 * 1000)
  }
})()
