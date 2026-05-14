// Shared helpers used by every per-directory filler.
// React + complex apps don't react to plain `value =` assignment — they need
// the input's native setter + a bubbling event. These helpers handle that.

function nativeSetValue(el, value) {
  if (!el) return false
  const proto = el.tagName === 'TEXTAREA'
    ? window.HTMLTextAreaElement.prototype
    : window.HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
  if (setter) setter.call(el, value)
  else el.value = value
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
  return true
}

function fillByName(name, value) {
  const el = document.querySelector(`input[name="${name}"], textarea[name="${name}"]`)
  return nativeSetValue(el, value)
}

function fillBySelector(selector, value) {
  const el = document.querySelector(selector)
  return nativeSetValue(el, value)
}

// Heuristic: find input by its visible label / aria-label / placeholder
function fillByLabel(labelText, value) {
  const wanted = labelText.toLowerCase()
  const inputs = document.querySelectorAll('input, textarea')
  for (const el of inputs) {
    // Check aria-label
    const aria = (el.getAttribute('aria-label') || '').toLowerCase()
    if (aria && aria.includes(wanted)) return nativeSetValue(el, value)
    // Check placeholder
    const ph = (el.getAttribute('placeholder') || '').toLowerCase()
    if (ph && ph.includes(wanted)) return nativeSetValue(el, value)
    // Check linked <label for=id>
    const id = el.getAttribute('id')
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`)
      if (label && label.textContent.toLowerCase().includes(wanted)) {
        return nativeSetValue(el, value)
      }
    }
    // Check wrapping <label>
    const wrapLabel = el.closest('label')
    if (wrapLabel && wrapLabel.textContent.toLowerCase().includes(wanted)) {
      return nativeSetValue(el, value)
    }
  }
  return false
}

// Smart category matcher — pick the dropdown option that best matches user category
function selectClosestOption(selectEl, target) {
  if (!selectEl || !target) return false
  const wanted = target.toLowerCase()
  const opts = Array.from(selectEl.options || [])
  // Exact match
  let chosen = opts.find(o => o.text.toLowerCase() === wanted)
  // Contains
  if (!chosen) chosen = opts.find(o => o.text.toLowerCase().includes(wanted))
  // Token overlap
  if (!chosen) {
    const tokens = wanted.split(/\s+/)
    chosen = opts.find(o => tokens.some(t => o.text.toLowerCase().includes(t)))
  }
  if (chosen) {
    selectEl.value = chosen.value
    selectEl.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  }
  return false
}

// Toast — small floating confirmation
function directoToast(msg, type = 'success') {
  const old = document.getElementById('__directo_toast')
  if (old) old.remove()
  const el = document.createElement('div')
  el.id = '__directo_toast'
  el.className = `__directo_toast __directo_toast_${type}`
  el.textContent = msg
  document.body.appendChild(el)
  setTimeout(() => el.classList.add('__directo_toast_show'), 10)
  setTimeout(() => {
    el.classList.remove('__directo_toast_show')
    setTimeout(() => el.remove(), 300)
  }, 3200)
}

// Expose
window.__directoFill = {
  nativeSetValue, fillByName, fillBySelector, fillByLabel,
  selectClosestOption, directoToast,
}
