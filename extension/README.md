# Directo Chrome Extension

Auto-fills 100+ SaaS directory submission forms with your product details from Directo dashboard.

## 🧪 Local development — Load extension in Chrome

1. Open Chrome → `chrome://extensions/`
2. Toggle **Developer mode** ON (top-right)
3. Click **Load unpacked**
4. Select the `extension/` folder from this project
5. Pin the Directo icon to toolbar

## 🔌 Connect to your Directo account

1. Run web app locally: `npm run dev` (it runs on `http://localhost:3000`)
2. Sign in → go to **Dashboard → Extension** (`/dashboard/extension`)
3. Click "Generate connection token" → copy the token
4. Click Directo extension icon → paste token → Connect

## 🎯 Use

1. Visit any supported directory's submit page (e.g. `producthunt.com/posts/new`)
2. The Directo floating widget appears in bottom-right
3. Click **⚡ Autofill** — form fields get filled with your product details
4. CAPTCHA / final review → you submit
5. Status auto-syncs back to your Directo dashboard

## 📋 Supported directories (v0.1)

- Product Hunt
- BetaList
- SaaSHub
- AlternativeTo
- IndieHackers
- Uneed.best
- Toolify.ai
- There's an AI for that

## 🚀 Production

Update `extension/popup/welcome.html` and the `default` Directo base URL in `extension/lib/api.js` to your production domain before packaging for Chrome Web Store.

## 📦 Package for Chrome Web Store

```bash
cd extension
zip -r directo-extension.zip . -x "*.md" "node_modules/*"
```

Upload `directo-extension.zip` to Chrome Web Store Developer Console.
