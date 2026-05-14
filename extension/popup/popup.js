import { getConfig, setConfig, clearConfig, fetchProduct, apiFetch } from '../lib/api.js'

const $ = (id) => document.getElementById(id)
const app = $('app')

function render(html) { app.innerHTML = html }

async function init() {
  const cfg = await getConfig()
  if (!cfg.token) return renderConnect(cfg)
  // Try to fetch product
  try {
    const product = await fetchProduct(true)
    renderConnected(product, cfg)
  } catch (e) {
    if (String(e.message).includes('TOKEN_INVALID')) {
      renderConnect(cfg, 'Your token is invalid or expired. Reconnect below.')
    } else {
      renderError(e.message, cfg)
    }
  }
}

function renderConnect(cfg, err) {
  render(`
    ${err ? `<div class="err">${err}</div>` : ''}
    <div class="card">
      <div class="step">
        <span class="step_num">1</span>
        <span class="step_text">Open <a href="${cfg.base}/dashboard/extension" target="_blank">Directo → Settings → Extension</a></span>
      </div>
      <div class="step">
        <span class="step_num">2</span>
        <span class="step_text">Copy your connection token</span>
      </div>
      <div class="step">
        <span class="step_num">3</span>
        <span class="step_text">Paste below and click Connect</span>
      </div>
    </div>

    <label class="input-label">Connection token</label>
    <input id="token" class="input" placeholder="directo_tok_..." type="text" />

    <label class="input-label">Directo base URL <span style="color:#52525b">(advanced)</span></label>
    <input id="base" class="input" value="${cfg.base}" />

    <button class="btn" id="connect">Connect</button>
    <button class="btn btn_secondary" id="open-pair">Open Directo settings ↗</button>
  `)

  $('connect').onclick = async () => {
    const token = $('token').value.trim()
    const base = $('base').value.trim() || cfg.base
    if (!token) return
    await setConfig({ token, base })
    init()
  }
  $('open-pair').onclick = () => {
    chrome.tabs.create({ url: `${cfg.base}/dashboard/extension` })
  }
}

function renderConnected(product, cfg) {
  render(`
    <div class="ok">✓ Connected to Directo</div>
    <div class="card">
      <div class="label">Active product</div>
      <div class="field">${escape(product?.name || 'No product yet')}</div>
      ${product?.url ? `<div class="field_sub">${escape(product.url)}</div>` : ''}
    </div>

    <div class="card">
      <div class="stat-row"><span class="stat-label">Plan</span><span class="stat-val">${escape(product?.plan || 'free')}</span></div>
      <div class="stat-row"><span class="stat-label">Submissions</span><span class="stat-val">${product?.submissionsCount ?? 0}</span></div>
      <div class="stat-row"><span class="stat-label">Approved</span><span class="stat-val">${product?.approvedCount ?? 0}</span></div>
    </div>

    <button class="btn" id="refresh">↻ Refresh</button>
    <button class="btn btn_secondary btn_danger" id="disconnect">Disconnect</button>
    <p style="text-align:center;color:#52525b;font-size:10px;margin-top:10px">Visit any supported directory's submit page — autofill appears automatically.</p>
  `)

  $('refresh').onclick = async () => {
    render('<div class="loading">Refreshing...</div>')
    init()
  }
  $('disconnect').onclick = async () => {
    if (confirm('Disconnect Directo extension?')) {
      await clearConfig()
      init()
    }
  }
}

function renderError(msg, cfg) {
  render(`
    <div class="err">⚠️ ${escape(msg)}</div>
    <button class="btn" id="retry">Retry</button>
    <button class="btn btn_secondary" id="reset">Reset connection</button>
  `)
  $('retry').onclick = init
  $('reset').onclick = async () => { await clearConfig(); init() }
}

function escape(s) {
  return String(s || '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]))
}

// Footer link
$('open-dashboard').addEventListener('click', async (e) => {
  e.preventDefault()
  const cfg = await getConfig()
  chrome.tabs.create({ url: cfg.base + '/dashboard' })
})

init()
