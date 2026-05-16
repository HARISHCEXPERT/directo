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

  window.__directoScanForm = scanForm
  window.__directoFillField = fillField
})()
