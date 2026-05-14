// Master list of supported directories.
// Each entry: slug, displayName, url pattern (regex), submit pattern (where forms live)
// The overlay uses `submitPattern` to decide when to show the autofill badge.

const DIRECTORIES = [
  {
    slug: 'producthunt',
    name: 'Product Hunt',
    urlPattern: /producthunt\.com/,
    submitPattern: /producthunt\.com\/posts\/new/,
  },
  {
    slug: 'betalist',
    name: 'BetaList',
    urlPattern: /betalist\.com/,
    submitPattern: /betalist\.com\/(submit|startups\/new)/,
  },
  {
    slug: 'saashub',
    name: 'SaaSHub',
    urlPattern: /saashub\.com/,
    submitPattern: /saashub\.com\/(submit|software\/new)/,
  },
  {
    slug: 'alternativeto',
    name: 'AlternativeTo',
    urlPattern: /alternativeto\.net/,
    submitPattern: /alternativeto\.net\/(submit|new-app)/,
  },
  {
    slug: 'indiehackers',
    name: 'IndieHackers',
    urlPattern: /indiehackers\.com/,
    submitPattern: /indiehackers\.com\/(new-post|products\/new)/,
  },
  {
    slug: 'uneed',
    name: 'Uneed',
    urlPattern: /uneed\.best/,
    submitPattern: /uneed\.best\/(submit|new)/,
  },
  {
    slug: 'toolify',
    name: 'Toolify',
    urlPattern: /toolify\.ai/,
    submitPattern: /toolify\.ai\/(submit|new)/,
  },
  {
    slug: 'taaft',
    name: "There's an AI for that",
    urlPattern: /theresanaiforthat\.com/,
    submitPattern: /theresanaiforthat\.com\/(submit|add)/,
  },
]

// Match the current URL to a directory entry
function matchDirectory(href) {
  return DIRECTORIES.find(d => d.urlPattern.test(href))
}

// Is current URL a SUBMIT/new-form page?
function matchSubmitPage(href) {
  return DIRECTORIES.find(d => d.submitPattern.test(href))
}

// Expose to other content scripts (they share `window` via injection order)
window.__directoDirectories = DIRECTORIES
window.__directoMatchDirectory = matchDirectory
window.__directoMatchSubmitPage = matchSubmitPage
