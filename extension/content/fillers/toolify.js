// Filler: Toolify.ai
window.__directoFillers = window.__directoFillers || {}

window.__directoFillers.toolify = function fillToolify(product) {
  const { fillByLabel, selectClosestOption, directoToast } = window.__directoFill
  let filled = 0

  if (fillByLabel('tool name', product.name) || fillByLabel('name', product.name)) filled++
  if (fillByLabel('website', product.url) || fillByLabel('url', product.url)) filled++
  if (fillByLabel('description', product.description)) filled++
  if (fillByLabel('short intro', (product.description || '').slice(0, 100))) filled++

  if (product.category) {
    const cat = document.querySelector('select[name*="category"]')
    if (selectClosestOption(cat, product.category)) filled++
  }

  directoToast(`Filled ${filled} fields on Toolify`, filled ? 'success' : 'error')
  return filled
}
