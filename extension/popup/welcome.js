// CSP-safe handler for the welcome page (no inline onclick).
document.getElementById('openDashboard').addEventListener('click', () => {
  chrome.storage.local.get('directoBase', (data) => {
    const base = data.directoBase || 'https://dicrecto.vercel.app'
    window.open(`${base}/dashboard/extension`, '_blank')
  })
})
