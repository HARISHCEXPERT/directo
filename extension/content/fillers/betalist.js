// Filler: BetaList — /submit
window.__directoFillers = window.__directoFillers || {}

window.__directoFillers.betalist = function fillBetaList(product) {
  const { fillByName, fillByLabel, fillBySelector, selectClosestOption, directoToast } = window.__directoFill
  let filled = 0

  // BetaList field names — best-effort with multiple fallbacks
  if (fillByName('startup[name]', product.name) ||
      fillByLabel('startup name', product.name) ||
      fillByLabel('name', product.name)) filled++

  if (fillByName('startup[url]', product.url) ||
      fillByLabel('url', product.url) ||
      fillByLabel('website', product.url)) filled++

  if (fillByName('startup[pitch]', product.description) ||
      fillByLabel('pitch', product.description) ||
      fillByLabel('description', product.description) ||
      fillByLabel('what does', product.description)) filled++

  if (product.twitter) {
    if (fillByName('startup[twitter]', product.twitter) ||
        fillByLabel('twitter', product.twitter)) filled++
  }

  // Category
  if (product.category) {
    const cat = document.querySelector('select[name="startup[category]"], select[name*="category"]')
    if (selectClosestOption(cat, product.category)) filled++
  }

  directoToast(`Filled ${filled} fields on BetaList`, filled ? 'success' : 'error')
  return filled
}
