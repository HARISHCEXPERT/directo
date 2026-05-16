// Curated list of directories Directo supports.
// Used by: overlay (detect submit page), approval-detector (detect listing).
// The AI filler works on ANY page — this list just controls where the widget appears.

const DIRECTORIES = [
  { slug: 'producthunt',  name: 'Product Hunt',         host: /producthunt\.com$/i,        submitPath: /\/posts\/new/i },
  { slug: 'betalist',     name: 'BetaList',             host: /betalist\.com$/i,           submitPath: /\/(submit|startups\/new)/i },
  { slug: 'saashub',      name: 'SaaSHub',              host: /saashub\.com$/i,            submitPath: /\/(submit|software\/new)/i },
  { slug: 'alternativeto',name: 'AlternativeTo',        host: /alternativeto\.net$/i,      submitPath: /\/(submit|new-app)/i },
  { slug: 'indiehackers', name: 'IndieHackers',         host: /indiehackers\.com$/i,       submitPath: /\/(new-post|products\/new)/i },
  { slug: 'uneed',        name: 'Uneed',                host: /uneed\.best$/i,             submitPath: /\/(submit|new)/i },
  { slug: 'toolify',      name: 'Toolify',              host: /toolify\.ai$/i,             submitPath: /\/(submit|new)/i },
  { slug: 'taaft',        name: "There's an AI for that", host: /theresanaiforthat\.com$/i, submitPath: /\/(submit|add)/i },
  { slug: 'startupbase',  name: 'Startupbase',          host: /startupbase\.io$/i,         submitPath: /\/(submit|new)/i },
  { slug: 'launchingtoday',name: 'Launching Today',     host: /launching\.today$/i,        submitPath: /\/(submit|new)/i },
  { slug: 'tinylaunch',   name: 'TinyLaunch',           host: /tinylaunch\.com$/i,         submitPath: /\/(submit|new)/i },
  { slug: 'fazier',       name: 'Fazier',               host: /fazier\.com$/i,             submitPath: /\/(submit|new)/i },
  { slug: 'peerlist',     name: 'Peerlist',             host: /peerlist\.io$/i,            submitPath: /\/(scout|projects\/new)/i },
  { slug: 'starterstory', name: 'Starter Story',        host: /starterstory\.com$/i,       submitPath: /\/(submit|new)/i },
  { slug: 'allthingsai',  name: 'All Things AI',        host: /allthingsai\.com$/i,        submitPath: /\/(submit|new)/i },
  { slug: 'futuretools',  name: 'Future Tools',         host: /futuretools\.io$/i,         submitPath: /\/(submit|new)/i },
  { slug: 'aitoolhunt',   name: 'AI Tool Hunt',         host: /aitoolhunt\.com$/i,         submitPath: /\/(submit|new)/i },
  { slug: 'toolpilot',    name: 'ToolPilot',            host: /toolpilot\.ai$/i,           submitPath: /\/(submit|new)/i },
  { slug: 'opentools',    name: 'OpenTools',            host: /opentools\.ai$/i,           submitPath: /\/(submit|new)/i },
]

function hostNormalize(h) { return (h || '').replace(/^www\./i, '').toLowerCase() }

function matchDirectory(href) {
  try {
    const u = new URL(href)
    const host = hostNormalize(u.hostname)
    return DIRECTORIES.find(d => d.host.test(host))
  } catch { return null }
}

function isSubmitPage(href, dir = null) {
  const d = dir || matchDirectory(href)
  if (!d) return false
  try {
    const u = new URL(href)
    return d.submitPath.test(u.pathname)
  } catch { return false }
}

window.__directoDirectories = DIRECTORIES
window.__directoMatchDirectory = matchDirectory
window.__directoIsSubmitPage = isSubmitPage
