// Filler: Uneed.best
window.__directoFillers = window.__directoFillers || {}

window.__directoFillers.uneed = function fillUneed(product) {
  const { fillByLabel, selectClosestOption, directoToast } = window.__directoFill
  let filled = 0

  if (fillByLabel('name', product.name) || fillByLabel('tool name', product.name)) filled++
  if (fillByLabel('url', product.url) || fillByLabel('website', product.url)) filled++
  if (fillByLabel('description', product.description) || fillByLabel('what does', product.description)) filled++

  if (product.category) {
    const cat = document.querySelector('select[name*="category"], select[name*="tag"]')
    if (selectClosestOption(cat, product.category)) filled++
  }

  directoToast(`Filled ${filled} fields on Uneed`, filled ? 'success' : 'error')
  return filled
}
