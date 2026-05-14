// Filler: AlternativeTo
window.__directoFillers = window.__directoFillers || {}

window.__directoFillers.alternativeto = function fillAlternativeTo(product) {
  const { fillByLabel, fillByName, directoToast } = window.__directoFill
  let filled = 0

  if (fillByLabel('app name', product.name) || fillByLabel('name', product.name) || fillByName('Name', product.name)) filled++
  if (fillByLabel('url', product.url) || fillByLabel('website', product.url)) filled++
  if (fillByLabel('description', product.description) || fillByLabel('what is', product.description)) filled++
  if (fillByLabel('short description', (product.description || '').slice(0, 100))) filled++

  directoToast(`Filled ${filled} fields on AlternativeTo`, filled ? 'success' : 'error')
  return filled
}
