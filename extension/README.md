# Directo Chrome Extension — v0.2 (AI Edition)

AI auto-fills any SaaS directory submission form. Auto-detects when your listing goes live. By Directo.

## What's new in v0.2

- 🤖 **AI Universal Autofill** — Works on ANY directory (90+ supported). AI reads form labels, generates platform-perfect content, and fills every field. No per-site selectors.
- 🎯 **Passive approval detection** — When you naturally visit a directory and land on your own product's listing page, Directo auto-marks it as approved. Browser notification fires.
- ⚡ **Smart dropdown matching** — Categories matched by semantic meaning, not text equality.
- 🔒 **Sensitive fields skipped** — passwords, OTP, payment fields are never touched.
- 🚀 **CSP fixes** — Manifest V3 compliant, no inline JS.

## 🧪 Load in Chrome (developer mode)

1. Chrome → `chrome://extensions/`
2. Toggle **Developer mode** ON (top-right)
3. Click **Load unpacked**
4. Select the `extension/` folder
5. Pin the Directo icon to your toolbar (click 🧩 in toolbar → 📌 next to Directo)

## 🔌 Pair with your Directo account

1. Open https://dicrecto.vercel.app/dashboard/extension (or `localhost:3000` for dev)
2. Click **Generate new token** → copy
3. Click Directo extension icon in toolbar
4. Paste token → click **Connect**
5. ✓ Connected with your product details

## 🎯 Use

1. Visit any supported directory's submit page (e.g. `producthunt.com/posts/new`)
2. The Directo widget appears in bottom-right
3. Click **⚡ AI Autofill** — fields get filled smartly
4. CAPTCHA / final review → you submit
5. Directo auto-detects success → status syncs to dashboard

## 📋 Supported directories (v0.2)

Product Hunt · BetaList · SaaSHub · AlternativeTo · IndieHackers · Uneed · Toolify · There's an AI for that · Startupbase · Launching Today · TinyLaunch · Fazier · Peerlist · Starter Story · All Things AI · Future Tools · AI Tool Hunt · ToolPilot · OpenTools

*The AI fill works on ANY directory technically — this list controls where the floating widget appears.*

## 🔔 Approval auto-detection

When you naturally visit a directory and land on your own product's listing page, Directo detects it using these signals:
- URL contains your product slug
- Page H1 contains your product name
- Page links out to your product URL

2+ signals required → marked approved → browser notification fires.

## 📦 Package for Chrome Web Store

```bash
cd extension
zip -r ../directo-extension-v0.2.0.zip . -x "*.md"
```

Upload to https://chrome.google.com/webstore/devconsole — $5 one-time developer fee.

## 🐛 Debug

- Service worker logs: `chrome://extensions/` → Directo card → "service worker" link
- Content script logs: open the directory page → F12 → Console (look for `__directo_*` errors)
- Popup logs: right-click extension icon → "Inspect popup"
