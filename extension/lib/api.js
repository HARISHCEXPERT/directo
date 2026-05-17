// Directo extension — API client wrapper
// Reads stored token + Directo base URL, talks to /api/extension/*

const DEFAULT_BASE = 'https://dicrecto.vercel.app'

export async function getConfig() {
  const data = await chrome.storage.local.get(['directoToken', 'directoBase'])
  return {
    token: data.directoToken || null,
    base: data.directoBase || DEFAULT_BASE,
  }
}

export async function setConfig(patch) {
  const current = await getConfig()
  await chrome.storage.local.set({
    directoToken: patch.token ?? current.token,
    directoBase: patch.base ?? current.base,
  })
}

export async function clearConfig() {
  await chrome.storage.local.remove(['directoToken', 'directoBase', 'directoProduct'])
}

export async function apiFetch(path, opts = {}) {
  const { token, base } = await getConfig()
  if (!token) throw new Error('NOT_CONNECTED')

  const res = await fetch(`${base}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  })

  if (res.status === 401) {
    throw new Error('TOKEN_INVALID')
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API_${res.status}: ${text || res.statusText}`)
  }
  return res.json()
}

// Fetch active product + cache it
export async function fetchProduct(force = false) {
  if (!force) {
    const cached = await chrome.storage.local.get('directoProduct')
    if (cached.directoProduct && cached.directoProduct._ts > Date.now() - 60_000) {
      return cached.directoProduct.data
    }
  }
  const data = await apiFetch('/api/extension/me')
  await chrome.storage.local.set({
    directoProduct: { data, _ts: Date.now() },
  })
  return data
}

// Report a submission back to Directo dashboard
export async function logSubmission({ directorySlug, directoryUrl, status, verified, verificationMethod, successUrl }) {
  return apiFetch('/api/extension/log-submission', {
    method: 'POST',
    body: JSON.stringify({ directorySlug, directoryUrl, status, verified, verificationMethod, successUrl }),
  })
}

// ---- Launch queue helpers ----
export async function fetchLaunchStatus() {
  return apiFetch('/api/extension/launch/status')
}

export async function advanceLaunch({ sessionId, itemId, action, reason }) {
  return apiFetch('/api/extension/launch/advance', {
    method: 'POST',
    body: JSON.stringify({ sessionId, itemId, action, reason }),
  })
}
