// Filler: There's an AI for that
window.__directoFillers = window.__directoFillers || {}

window.__directoFillers.taaft = function fillTaaft(product) {
  const { fillByLabel, directoToast } = window.__directoFill
  let filled = 0

  if (fillByLabel('name', product.name) || fillByLabel('tool name', product.name)) filled++
  if (fillByLabel('url', product.url) || fillByLabel('website', product.url)) filled++
  if (fillByLabel('description', product.description) || fillByLabel('what does', product.description)) filled++

  directoToast(`Filled ${filled} fields on TAAFT`, filled ? 'success' : 'error')
  return filled
}
