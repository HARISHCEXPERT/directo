// Filler: Product Hunt — /posts/new
// PH uses Formik + custom Tagline/Name/URL fields.

window.__directoFillers = window.__directoFillers || {}

window.__directoFillers.producthunt = function fillProductHunt(product) {
  const { fillByName, fillByLabel, directoToast } = window.__directoFill
  let filled = 0

  // Name
  if (fillByName('post[name]', product.name)) filled++
  else if (fillByLabel('name', product.name)) filled++

  // Tagline (max 60)
  const tagline = (product.description || '').slice(0, 60)
  if (fillByName('post[tagline]', tagline)) filled++
  else if (fillByLabel('tagline', tagline)) filled++

  // URL
  if (fillByName('post[url]', product.url)) filled++
  else if (fillByLabel('website', product.url)) filled++

  // Twitter
  if (product.twitter) {
    if (fillByName('post[makers_twitter_username]', product.twitter)) filled++
  }

  // Description / body (longer)
  if (product.description) {
    fillByLabel('description', product.description) && filled++
  }

  directoToast(`Filled ${filled} fields on Product Hunt`, filled ? 'success' : 'error')
  return filled
}
