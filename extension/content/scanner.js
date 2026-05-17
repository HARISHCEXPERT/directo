// Universal form scanner — collects metadata about EVERY visible form field
// on the page (including contenteditable rich-text editors) so AI can fill them.

;(function () {

  const SKIP_TYPES = new Set(['hidden', 'submit', 'button', 'reset', 'image', 'password', 'file'])
  const SENSITIVE_HINTS = /password|otp|captcha|payment|card\s*number|cvv|security\s*code|mobile\s*otp/i

  function isVisible(el) {
    if (!el) return false
    const cs = window.getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false
    const r = el.getBoundingClientRect()
    return r.width > 4 && r.height > 4
  }

  function clean(s) {
    return (s || '').replace(/\s+/g, ' ').trim().slice(0, 220)
  }

  // ---- Label discovery — checks 6 strategies ----
  function findLabel(el) {
    // 1. Linked label
    if (el.id) {
      const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`)
      if (lbl) return clean(lbl.textContent)
    }
    // 2. Wrapping <label>
    const wrap = el.closest('label')
    if (wrap) return clean(wrap.textContent)
    // 3. aria-labelledby
    const labelledBy = el.getAttribute('aria-labelledby')
    if (labelledBy) {
      const refs = labelledBy.split(/\s+/).map(id => document.getElementById(id)).filter(Boolean)
      const text = refs.map(r => r.textContent).join(' ')
      if (text.trim()) return clean(text)
    }
    // 4. Climb ancestors looking for label-ish siblings ABOVE the input
    let node = el
    for (let depth = 0; depth < 5; depth++) {
      const parent = node.parentElement
      if (!parent) break
      // Check label-like elements that are siblings BEFORE this node
      const candidates = Array.from(parent.querySelectorAll('label, .label, [class*="label" i], h2, h3, h4, h5, h6, [class*="title" i], [class*="heading" i]'))
        .filter(c => c !== el && !c.contains(el) && c.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)
      for (const c of candidates.reverse()) {
        const t = clean(c.textContent)
        if (t && t.length >= 2 && t.length < 120) return t
      }
      node = parent
      if (parent.tagName === 'FORM' || parent.tagName === 'BODY') break
    }
    // 5. Previous sibling text within parent
    const sib = el.previousElementSibling
    if (sib) {
      const t = clean(sib.textContent)
      if (t && t.length < 120) return t
    }
    // 6. Fall back to placeholder
    if (el.placeholder) return clean(el.placeholder)
    return null
  }

  // ---- Helper-text near a field (e.g. "max 60 chars", "Tell us about your launch") ----
  function findHelperText(el) {
    const parent = el.closest('div, fieldset, section, li, td')
    if (!parent) return null
    const nodes = parent.querySelectorAll('p, small, .helper, .hint, [class*="help" i], [class*="hint" i], [class*="description" i], [class*="subtitle" i]')
    for (const n of nodes) {
      if (n.contains(el)) continue
      const t = clean(n.textContent)
      if (t && t.length >= 4 && t.length < 200) return t
    }
    return null
  }

  function isSensitive(el, label) {
    const blob = [
      el.name, el.id, el.placeholder, el.getAttribute('aria-label'),
      el.getAttribute('autocomplete'), label,
    ].filter(Boolean).join(' ').toLowerCase()
    return SENSITIVE_HINTS.test(blob)
  }

  // ---- Universal field scanner ----
  function scanForm() {
    const fields = []
    let idx = 0

    // 1. Standard inputs, textareas, selects
    const inputs = document.querySelectorAll('input, textarea, select')
    for (const el of inputs) {
      const tag = el.tagName.toLowerCase()
      const type = (el.type || tag).toLowerCase()
      if (SKIP_TYPES.has(type)) continue
      if (!isVisible(el)) continue
      if (el.readOnly || el.disabled) continue

      const label = findLabel(el)
      if (isSensitive(el, label)) continue

      const directoId = `__directo_f_${idx++}`
      el.setAttribute('data-directo-fid', directoId)

      const field = {
        id: directoId,
        type,
        name: el.name || null,
        placeholder: el.placeholder || null,
        label: label || null,
        ariaLabel: el.getAttribute('aria-label') || null,
        helperText: findHelperText(el),
        maxLength: el.maxLength > 0 ? el.maxLength : null,
        required: !!el.required,
        currentValue: el.value || '',
      }
      if (tag === 'select') {
        field.options = Array.from(el.options || [])
          .filter(o => o.value !== '')
          .map(o => ({ value: o.value, text: clean(o.text) }))
        if (field.options.length > 60) field.options = field.options.slice(0, 60)
      }
      fields.push(field)
      if (fields.length >= 60) return fields
    }

    // 2. Contenteditable divs (rich-text editors, e.g. Product Hunt description, IndieHackers body)
    const editables = document.querySelectorAll('[contenteditable="true"], [contenteditable=""], [role="textbox"]')
    for (const el of editables) {
      if (!isVisible(el)) continue
      const label = findLabel(el)
      if (isSensitive(el, label)) continue
      // Skip if already a child of a form field we captured
      if (el.closest('[data-directo-fid]')) continue

      const directoId = `__directo_f_${idx++}`
      el.setAttribute('data-directo-fid', directoId)
      fields.push({
        id: directoId,
        type: 'richtext',
        name: el.getAttribute('name') || null,
        placeholder: el.getAttribute('data-placeholder') || el.getAttribute('placeholder') || null,
        label: label || null,
        ariaLabel: el.getAttribute('aria-label') || null,
        helperText: findHelperText(el),
        maxLength: null,
        required: el.getAttribute('aria-required') === 'true',
        currentValue: clean(el.textContent),
      })
      if (fields.length >= 60) break
    }

    return fields
  }

  function findFieldEl(field) {
    return document.querySelector(`[data-directo-fid="${field.id}"]`)
        || (field.name && document.querySelector(`[name="${CSS.escape(field.name)}"]`))
        || null
  }

  function fillSelectSmart(el, value) {
    const target = String(value || '').toLowerCase().trim()
    if (!target) return false
    const opts = Array.from(el.options || []).filter(o => o.value !== '')
    let m = opts.find(o => o.value.toLowerCase() === target)
        || opts.find(o => o.text.toLowerCase() === target)
        || opts.find(o => o.text.toLowerCase().includes(target))
        || opts.find(o => target.includes(o.text.toLowerCase()))
    if (!m) {
      const tokens = target.split(/\s+/).filter(t => t.length > 2)
      m = opts.find(o => tokens.some(t => o.text.toLowerCase().includes(t)))
    }
    if (m) {
      el.value = m.value
      el.dispatchEvent(new Event('change', { bubbles: true }))
      return true
    }
    return false
  }

  function fillContentEditable(el, value) {
    try {
      el.focus()
      // Replace existing content
      el.innerHTML = ''
      // Insert as plain text (preserves line breaks)
      const text = String(value || '')
      const lines = text.split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (i > 0) el.appendChild(document.createElement('br'))
        el.appendChild(document.createTextNode(lines[i]))
      }
      // Dispatch input events that most rich text editors listen to
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
      el.dispatchEvent(new Event('blur', { bubbles: true }))
      return true
    } catch { return false }
  }

  function fillField(field, value) {
    const el = findFieldEl(field)
    if (!el) return false
    if (field.type === 'richtext' || el.isContentEditable) return fillContentEditable(el, value)
    if (el.tagName === 'SELECT') return fillSelectSmart(el, value)
    if (field.maxLength && String(value).length > field.maxLength) {
      value = String(value).slice(0, field.maxLength)
    }
    return window.__directoFill.nativeSetValue(el, value)
  }

  // ---- ACTION BUTTON DETECTION ----
  const NEXT_RX = /^(next|continue|proceed|forward|save\s*&?\s*continue|step\s*\d|next\s*step|get\s*started|start|begin|let'?s\s*(go|start)|move\s*on)\b/i
  const SUBMIT_RX = /^(submit|publish|launch(\s+now)?|post|create(\s+(post|launch|product))?|finish|save\s*&?\s*publish|complete|done|send(\s+for\s+review)?|review|go\s+live)\b/i
  const BACK_RX = /^(back|prev|previous|cancel|close|exit)/i

  function btnText(el) {
    return (el.innerText || el.value || el.getAttribute('aria-label') || el.title || '').replace(/\s+/g, ' ').trim()
  }
  function isClickable(el) {
    if (!el || el.disabled) return false
    if (el.getAttribute('aria-disabled') === 'true') return false
    return isVisible(el)
  }
  function findActionButton() {
    const sels = 'button, input[type="submit"], input[type="button"], a[role="button"], [role="button"]'
    const all = Array.from(document.querySelectorAll(sels)).filter(isClickable)
    let nextBtn = null, submitBtn = null
    for (const el of all) {
      const text = btnText(el)
      if (!text || text.length > 60) continue
      if (BACK_RX.test(text)) continue
      if (el.type === 'submit' && !submitBtn) {
        if (NEXT_RX.test(text)) { nextBtn = nextBtn || el; continue }
        submitBtn = el
        continue
      }
      if (NEXT_RX.test(text)) { nextBtn = nextBtn || el; continue }
      if (SUBMIT_RX.test(text)) { submitBtn = submitBtn || el; continue }
    }
    if (nextBtn) return { el: nextBtn, kind: 'next', text: btnText(nextBtn) }
    if (submitBtn) return { el: submitBtn, kind: 'submit', text: btnText(submitBtn) }
    return null
  }

  function formSignature() {
    const fields = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]), textarea, select, [contenteditable="true"]')
    return Array.from(fields).slice(0, 30).map(f => {
      return [f.name, f.id, f.placeholder, f.getAttribute('aria-label'), f.getAttribute('data-placeholder')].filter(Boolean).join('|')
    }).join('::')
  }

  window.__directoScanForm = scanForm
  window.__directoFillField = fillField
  window.__directoFindActionButton = findActionButton
  window.__directoFormSignature = formSignature
})()
