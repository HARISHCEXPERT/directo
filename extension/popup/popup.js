import { getConfig, setConfig, clearConfig, fetchProduct, fetchLaunchStatus } from '../lib/api.js'

const $ = (id) => document.getElementById(id)
const app = $('app')
function render(html) { app.innerHTML = html }
function escape(s) {
  return String(s || '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]))
}

async function init() {
  const cfg = await getConfig()
  if (!cfg.token) return renderConnect(cfg)
  try {
    const [product, queue] = await Promise.all([
      fetchProduct(true),
      fetchLaunchStatus().catch(() => null),
    ])
    renderConnected(product, queue, cfg)
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
      <div class="step"><span class="step_num">1</span>
        <span class="step_text">Open <a href="${cfg.base}/dashboard/extension" target="_blank">Directo → Extension</a></span>
      </div>
      <div class="step"><span class="step_num">2</span><span class="step_text">Copy your connection token</span></div>
      <div class="step"><span class="step_num">3</span><span class="step_text">Paste below and click Connect</span></div>
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
  $('open-pair').onclick = () => chrome.tabs.create({ url: `${cfg.base}/dashboard/extension` })
}

function renderConnected(product, queueRes, cfg) {
  const queue = queueRes?.session
  const active = queueRes?.active
  render(`
    <div class="ok">✓ Connected to Directo</div>

    ${queue ? `
      <div class="card" style="border-color:rgba(139,92,246,0.4)">
        <div class="label" style="color:#a78bfa">${queue.status === 'paused' ? '⏸ Queue paused' : '🚀 Launch queue running'}</div>
        <div class="field">${queue.completed} / ${queue.total} done</div>
        <div style="background:#27272a;border-radius:99px;height:6px;margin-top:8px;overflow:hidden">
          <div style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);height:6px;width:${Math.round((queue.completed/Math.max(1,queue.total))*100)}%"></div>
        </div>
        ${active ? `<div class="field_sub" style="margin-top:8px">Active: ${escape(active.directory?.name || '')}</div>` : ''}
        ${queue.pause_reason ? `<div style="color:#fbbf24;font-size:11px;margin-top:6px">⚠ ${escape(queue.pause_reason.replace('_',' '))}</div>` : ''}
      </div>
      <button class="btn" id="open-launch">Open launch dashboard ↗</button>
    ` : `
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
      <button class="btn" id="start-launch">🚀 Start launch queue</button>
    `}

    <button class="btn btn_secondary" id="refresh">↻ Refresh</button>
    <button class="btn btn_secondary btn_danger" id="disconnect">Disconnect</button>
    <p style="text-align:center;color:#52525b;font-size:10px;margin-top:10px">
      Visit any supported directory's submit page — autofill appears automatically.
    </p>
  `)

  $('refresh').onclick = async () => { render('<div class="loading">Refreshing...</div>'); init() }
  $('disconnect').onclick = async () => {
    if (confirm('Disconnect Directo extension?')) { await clearConfig(); init() }
  }
  const sl = $('start-launch')
  if (sl) sl.onclick = () => chrome.tabs.create({ url: `${cfg.base}/dashboard/launch` })
  const ol = $('open-launch')
  if (ol) ol.onclick = () => chrome.tabs.create({ url: `${cfg.base}/dashboard/launch` })
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

$('open-dashboard').addEventListener('click', async (e) => {
  e.preventDefault()
  const cfg = await getConfig()
  chrome.tabs.create({ url: cfg.base + '/dashboard' })
})

init()
