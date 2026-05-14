// Filler: IndieHackers
window.__directoFillers = window.__directoFillers || {}

window.__directoFillers.indiehackers = function fillIndieHackers(product) {
  const { fillByLabel, fillByName, directoToast } = window.__directoFill
  let filled = 0

  if (fillByLabel('product name', product.name) || fillByLabel('name', product.name)) filled++
  if (fillByLabel('url', product.url) || fillByLabel('website', product.url)) filled++
  if (fillByLabel('tagline', (product.description || '').slice(0, 80))) filled++
  if (fillByLabel('description', product.description)) filled++

  directoToast(`Filled ${filled} fields on IndieHackers`, filled ? 'success' : 'error')
  return filled
}
