;(async function () {
  if (document.getElementById('__directo_overlay')) return

  const dir = window.__directoMatchDirectory(location.href)
  if (!dir) return
  const onSubmit = window.__directoIsSubmitPage(location.href, dir)

  const root = document.createElement('div')
  root.id = '__directo_overlay'
  document.body.appendChild(root)

  function escape(s) {
    return String(s || '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))
  }

  let activeObserver = null
  let totalFilled = 0
  let currentStep = 1
  let isFilling = false

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
    var closeBtn = document.getElementById('__directo_x')
    if (closeBtn) closeBtn.onclick = function() {
      if (activeObserver) activeObserver.disconnect()
      root.remove()
    }
  }

  function getProduct() {
    return new Promise(function(resolve) {
      chrome.runtime.sendMessage({ type: 'GET_PRODUCT' }, resolve)
    })
  }

  function logSubmission(status, payload) {
    if (!payload) payload = {}
    chrome.runtime.sendMessage({
      type: 'LOG_SUBMISSION',
      payload: { directorySlug: dir.slug, directoryUrl: location.href, status: status },
    })
  }

  function doAIFill() {
    return window.__directoAIFill({
      directorySlug: dir.slug,
      directoryName: dir.name,
    })
  }

 function showFilledState(product) {
    render({
      product: product,
      success: '✅ ' + totalFilled + ' fields filled across ' + currentStep + ' step' + (currentStep > 1 ? 's' : ''),
      body: '<div class="__directo_status">' +
        (currentStep > 1 ? '🔄 Multi-step detected — watching next step...' : 'Review form, solve CAPTCHA, then submit.') +
        '<br><span class="__directo_dim">AI auto-fills each new step.</span></div>' +
        '<button class="__directo_btn" id="__directo_refill">⚡ Refill this step</button>' +
        '<button class="__directo_btn __directo_btn_secondary" id="__directo_done">I\'ve submitted — mark done</button>',
    })
    var doneBtn = document.getElementById('__directo_done')
    if (doneBtn) {
      doneBtn.addEventListener('click', function() {
        logSubmission('submitted', { verified: true, verificationMethod: 'manual_confirm' })
        if (activeObserver) activeObserver.disconnect()
        if (window.__directoFill && window.__directoFill.directoToast) {
          window.__directoFill.directoToast('Marked submitted on ' + dir.name, 'success')
        }
        setTimeout(function() { root.remove() }, 1200)
      })
    }
    var refillBtn = document.getElementById('__directo_refill')
    if (refillBtn) {
      refillBtn.addEventListener('click', function() {
        isFilling = true
        render({
          product: product,
          body: '<div class="__directo_status"><div class="__directo_spinner"></div>Re-filling current step...</div>',
        })
        doAIFill().then(function(result) {
          isFilling = false
          if (result.filled > 0) {
            totalFilled += result.filled
          }
          showFilledState(product)
        })
      })
    }
  }

  function watchForNewFields(product) {
    var lastFieldCount = document.querySelectorAll(
      'input:not([type=hidden]):not([type=password]):not([type=submit]), textarea, select'
    ).length

    if (activeObserver) activeObserver.disconnect()

    activeObserver = new MutationObserver(function() {
      if (isFilling) return
      var currentFieldCount = document.querySelectorAll(
        'input:not([type=hidden]):not([type=password]):not([type=submit]), textarea, select'
      ).length

      if (currentFieldCount !== lastFieldCount && currentFieldCount > 0) {
        lastFieldCount = currentFieldCount
        currentStep++

        setTimeout(function() {
          isFilling = true
          render({
            product: product,
            success: '✅ Step ' + (currentStep - 1) + ' done · ' + totalFilled + ' fields filled',
            body: '<div class="__directo_status"><div class="__directo_spinner"></div>AI filling step ' + currentStep + '...</div>',
          })

          doAIFill().then(function(result) {
            isFilling = false
            if (result.filled > 0) {
              totalFilled += result.filled
              if (window.__directoFill && window.__directoFill.directoToast) {
                window.__directoFill.directoToast('⚡ Step ' + currentStep + ': ' + result.filled + ' fields filled', 'success')
              }
            }
            showFilledState(product)
          })
        }, 800)
      }
    })

    activeObserver.observe(document.body, { childList: true, subtree: true })
    setTimeout(function() {
      if (activeObserver) activeObserver.disconnect()
    }, 15 * 60 * 1000)
  }

  function watchForSuccess(product) {
    var initialUrl = location.href
    var initialForm = document.querySelector('form')
    var detected = false

    var detector = setInterval(function() {
      if (detected) { clearInterval(detector); return }
      var urlChanged = location.href !== initialUrl
      var formGone = initialForm && !document.body.contains(initialForm)
      var successText = /thank you|received|in queue|under review|pending review|submitted|moderation|success/i.test(
        document.body && document.body.innerText ? document.body.innerText.slice(0, 4000) : ''
      )
      var stillOnSubmit = window.__directoIsSubmitPage(location.href, dir)

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
          product: product,
          success: '🎉 Submission confirmed on ' + escape(dir.name) + '!',
          body: '<button class="__directo_btn __directo_btn_secondary" id="__directo_close2">Close</button>',
        })
        var close2 = document.getElementById('__directo_close2')
        if (close2) {
          close2.addEventListener('click', function() { root.remove() })
        }
      }
    }, 1800)

    setTimeout(function() { clearInterval(detector) }, 10 * 60 * 1000)
  }

  render({ body: '<div class="__directo_status">Connecting to Directo...</div>' })

  var r = await getProduct()
  if (!r || !r.ok) {
    render({
      warn: 'Directo not connected. Click the extension icon → paste your token.',
      body: '<button class="__directo_btn" id="__directo_open_popup">Open Directo</button>',
    })
    var openBtn = document.getElementById('__directo_open_popup')
    if (openBtn) openBtn.onclick = function() {
      chrome.runtime.sendMessage({ type: 'OPEN_POPUP' })
    }
    return
  }
  var product = r.product

  if (!onSubmit) {
    render({
      product: product,
      body: '<div class="__directo_status">Open the submit form on ' + escape(dir.name) + ' — Directo will auto-fill it.</div>',
    })
    return
  }

  render({
    product: product,
    body: '<button class="__directo_btn" id="__directo_fill">⚡ AI Autofill ' + escape(dir.name) + ' form</button>' +
      '<button class="__directo_btn __directo_btn_secondary" id="__directo_skip">Skip</button>' +
      '<p class="__directo_caption">AI reads every step &amp; fills automatically. You handle CAPTCHA + submit.</p>',
  })

  var skipBtn = document.getElementById('__directo_skip')
  if (skipBtn) skipBtn.onclick = function() {
    logSubmission('visited', { verified: false, verificationMethod: 'none' })
    if (activeObserver) activeObserver.disconnect()
    root.remove()
  }

  var fillBtn = document.getElementById('__directo_fill')
  if (fillBtn) fillBtn.onclick = async function() {
    render({
      product: product,
      body: '<div class="__directo_status"><div class="__directo_spinner"></div>AI is reading step 1 and filling fields...</div>',
    })

    isFilling = true
    var result = await doAIFill()
    isFilling = false

    if (!result.filled || result.filled === 0) {
      render({
        product: product,
        warn: result.error ? 'AI fill failed: ' + escape(result.error) : "Couldn't fill the form. Please fill manually.",
        body: '<button class="__directo_btn __directo_btn_secondary" id="__directo_retry">↻ Retry</button>' +
          '<button class="__directo_btn __directo_btn_secondary" id="__directo_close_btn">Close</button>',
      })
      var retryBtn = document.getElementById('__directo_retry')
      if (retryBtn) retryBtn.onclick = function() { location.reload() }
      var closeBtn2 = document.getElementById('__directo_close_btn')
      if (closeBtn2) closeBtn2.onclick = function() { root.remove() }
      return
    }

    totalFilled = result.filled
    showFilledState(product)
    watchForNewFields(product)
    watchForSuccess(product)
  }
})()