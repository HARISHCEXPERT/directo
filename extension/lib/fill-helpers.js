// Minimal helpers shared by scanner + overlay.

function nativeSetValue(el, value) {
  if (!el) return false
  const proto = el.tagName === 'TEXTAREA'
    ? window.HTMLTextAreaElement.prototype
    : window.HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
  if (setter) setter.call(el, String(value))
  else el.value = String(value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
  return true
}

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
  }, 3500)
}

window.__directoFill = { nativeSetValue, directoToast }
