// Universal form scanner — collects metadata about EVERY visible form field
// on the page so AI can decide what to fill it with.

;(function () {

  const SKIP_TYPES = new Set(['hidden', 'submit', 'button', 'reset', 'image', 'password', 'file'])
  const SENSITIVE_HINTS = /password|otp|captcha|payment|card|cvv|email|phone|mobile/i

  function isVisible(el) {
    if (!el || el.offsetParent === null) {
      // offsetParent can be null even for visible position:fixed elements
      const cs = window.getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden') return false
    }
    const r = el.getBoundingClientRect()
    return r.width > 4 && r.height > 4
  }

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
      const ref = document.getElementById(labelledBy)
      if (ref) return clean(ref.textContent)
    }
    // 4. Preceding heading/label-ish sibling within parent
    const parent = el.closest('div, fieldset, section, li, td, .form-group, .field, [role="group"]')
    if (parent) {
      const candidates = parent.querySelectorAll('label, .label, h2, h3, h4, h5, h6, .text-sm, span')
      for (const c of candidates) {
        const t = clean(c.textContent)
        if (t && t.length < 120 && !c.contains(el)) return t
      }
    }
    return null
  }

  function clean(s) {
    return (s || '').replace(/\s+/g, ' ').trim().slice(0, 200)
  }

  function isSensitive(el, label) {
    const blob = [
      el.name, el.id, el.placeholder, el.getAttribute('aria-label'),
      el.getAttribute('autocomplete'), label,
    ].filter(Boolean).join(' ').toLowerCase()
    return SENSITIVE_HINTS.test(blob)
  }

  function scanForm() {
    const fields = []
    const all = document.querySelectorAll('input, textarea, select')
    let idx = 0
    for (const el of all) {
      const tag = el.tagName.toLowerCase()
      const type = (el.type || tag).toLowerCase()
      if (SKIP_TYPES.has(type)) continue
      if (!isVisible(el)) continue

      const label = findLabel(el)
      if (isSensitive(el, label)) continue
      if (el.readOnly || el.disabled) continue

      // Stamp a stable id we control
      const directoId = `__directo_f_${idx++}`
      el.setAttribute('data-directo-fid', directoId)

      const field = {
        id: directoId,
        type,
        name: el.name || null,
        placeholder: el.placeholder || null,
        label: label || null,
        ariaLabel: el.getAttribute('aria-label') || null,
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
      if (fields.length >= 40) break
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

  function fillField(field, value) {
    const el = findFieldEl(field)
    if (!el) return false
    if (el.tagName === 'SELECT') return fillSelectSmart(el, value)
    if (field.maxLength && String(value).length > field.maxLength) {
      value = String(value).slice(0, field.maxLength)
    }
    return window.__directoFill.nativeSetValue(el, value)
  }

  // ----- ACTION BUTTON DETECTION -----
  // Find the most likely "next/continue" or "submit" button on the current step.
  // Returns: { el, kind: 'next' | 'submit' } | null
  // Heuristic-based (no AI cost) using button text + aria-label + name patterns.

  const NEXT_RX = /^(next|continue|proceed|forward|save\s*&?\s*continue|step\s*\d|next\s*step|get\s*started|start|begin|let'?s\s*(go|start)|move\s*on)\b/i
  const SUBMIT_RX = /^(submit|publish|launch(\s+now)?|post|create(\s+(post|launch|product))?|finish|save\s*&?\s*publish|complete|done|send(\s+for\s+review)?|review|go\s+live)\b/i
  const BACK_RX = /^(back|prev|previous|cancel|close|exit)/i

  function btnText(el) {
    const t = (el.innerText || el.value || el.getAttribute('aria-label') || el.title || '').replace(/\s+/g, ' ').trim()
    return t
  }

  function isClickable(el) {
    if (!el || el.disabled) return false
    if (el.getAttribute('aria-disabled') === 'true') return false
    if (!isVisible(el)) return false
    return true
  }

  function findActionButton() {
    const sels = 'button, input[type="submit"], input[type="button"], a[role="button"], [role="button"]'
    const all = Array.from(document.querySelectorAll(sels)).filter(isClickable)
    let nextBtn = null, submitBtn = null
    for (const el of all) {
      const text = btnText(el)
      if (!text || text.length > 60) continue
      if (BACK_RX.test(text)) continue
      // Strongest signal: explicit type=submit
      if (el.type === 'submit' && !submitBtn) {
        // If the submit btn text says "next/continue" treat as next
        if (NEXT_RX.test(text)) { nextBtn = nextBtn || el; continue }
        submitBtn = el
        continue
      }
      if (NEXT_RX.test(text)) { nextBtn = nextBtn || el; continue }
      if (SUBMIT_RX.test(text)) { submitBtn = submitBtn || el; continue }
    }
    // Prefer NEXT if both — user clicks submit themselves
    if (nextBtn) return { el: nextBtn, kind: 'next', text: btnText(nextBtn) }
    if (submitBtn) return { el: submitBtn, kind: 'submit', text: btnText(submitBtn) }
    return null
  }

  // A "form signature" — used to detect when the step has actually changed.
  function formSignature() {
    const fields = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]), textarea, select')
    return Array.from(fields).slice(0, 30).map(f => {
      return [f.name, f.id, f.placeholder, f.getAttribute('aria-label')].filter(Boolean).join('|')
    }).join('::')
  }

  window.__directoScanForm = scanForm
  window.__directoFillField = fillField
  window.__directoFindActionButton = findActionButton
  window.__directoFormSignature = formSignature
})()
