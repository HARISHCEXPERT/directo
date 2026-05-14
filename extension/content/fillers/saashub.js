// Filler: SaaSHub
window.__directoFillers = window.__directoFillers || {}

window.__directoFillers.saashub = function fillSaaSHub(product) {
  const { fillByName, fillByLabel, selectClosestOption, directoToast } = window.__directoFill
  let filled = 0

  if (fillByName('software[name]', product.name) || fillByLabel('name', product.name)) filled++
  if (fillByName('software[website]', product.url) || fillByLabel('website', product.url)) filled++
  if (fillByName('software[description]', product.description) || fillByLabel('description', product.description)) filled++
  if (product.twitter && (fillByName('software[twitter]', product.twitter) || fillByLabel('twitter', product.twitter))) filled++

  if (product.category) {
    const cat = document.querySelector('select[name*="category"], select[name*="tag"]')
    if (selectClosestOption(cat, product.category)) filled++
  }

  directoToast(`Filled ${filled} fields on SaaSHub`, filled ? 'success' : 'error')
  return filled
}
