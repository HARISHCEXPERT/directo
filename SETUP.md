# 🚀 Directo — Setup & Update Guide

> **Personal note for you bhai.** Local par run karne se pehle yeh padh.
> Sab commands, env vars, SQL migrations, Razorpay + Chrome extension — sab yahin hai.

---

## 📥 Step 0 — Yeh updates apne laptop par kaise laaye

> **⚠️ FIRST TIME ONLY — critical cleanup:** Agar tere GitHub / laptop par `src/` folder pada hai (purana structure), **`CLEANUP.md` follow kar pehle**. Warna dono versions compile honge aur chaos hoga (jaise pichli baar 5 ghante laga).

Tu **GitHub workflow** use karta hai (HARISHCEXPERT/directo). Updates 2 tariko se aa sakte hain:

### Option A — Pura project ZIP (sabse simple)

1. Workspace ke top-right **"⋮" menu → Download Project** click kar
2. ZIP milega (`directo-XXXX.zip`)
3. Apne laptop par jo `directo` GitHub clone hai usme **manually files overwrite** kar
4. Terminal:
   ```bash
   cd /path/to/directo
   git status                # check kya change hua
   git add .
   git commit -m "feat: ai + admin + razorpay + chrome extension"
   git push origin main
   ```

### Option B — Sirf naye/changed files (cleaner diff)

Iss update mein yeh aaye hain:

```
NEW FILES (web app):
├── lib/ai/prompts.ts                            (per-platform AI prompts)
├── lib/ai/claude.ts                             (Anthropic SDK wrapper)
├── lib/billing/plans.ts                         (pricing config)
├── lib/ext-auth.ts                              (extension token auth helper)
├── app/api/generate-content/route.ts            (AI content API)
├── app/api/admin/usage/route.ts                 (admin dashboard API)
├── app/api/billing/create-order/route.ts        (Razorpay order)
├── app/api/billing/verify/route.ts              (Razorpay verify)
├── app/api/extension/me/route.ts                (extension fetch product)
├── app/api/extension/log-submission/route.ts    (extension log submission)
├── app/api/extension/tokens/route.ts            (token CRUD)
├── app/(dashboard)/dashboard/admin/page.tsx     (cost dashboard UI)
├── app/(dashboard)/dashboard/extension/page.tsx (extension pairing UI)
├── app/pricing/page.tsx                         (pricing page)
├── db/migrations/001_ai_generations.sql
├── db/migrations/002_admin_dashboard.sql
├── db/migrations/003_billing.sql
├── db/migrations/004_ext_tokens.sql
├── .env.example
└── SETUP.md                                     (yeh file)

NEW FILES (Chrome extension):
├── extension/manifest.json
├── extension/background/service-worker.js
├── extension/popup/index.html
├── extension/popup/popup.css
├── extension/popup/popup.js
├── extension/popup/welcome.html
├── extension/content/overlay.js
├── extension/content/overlay.css
├── extension/content/fillers/producthunt.js
├── extension/content/fillers/betalist.js
├── extension/content/fillers/saashub.js
├── extension/content/fillers/alternativeto.js
├── extension/content/fillers/indiehackers.js
├── extension/content/fillers/uneed.js
├── extension/content/fillers/toolify.js
├── extension/content/fillers/taaft.js
├── extension/lib/api.js
├── extension/lib/directories.js
├── extension/lib/fill-helpers.js
├── extension/icons/icon16.png
├── extension/icons/icon48.png
├── extension/icons/icon128.png
└── extension/README.md

UPDATED FILES:
├── package.json                                 (new deps: anthropic, razorpay)
├── tsconfig.json                                (path alias fix)
├── app/(dashboard)/dashboard/content/page.tsx   (real Claude API hookup)
└── app/(dashboard)/layout.tsx                   (added Extension + Admin links, brand → "Directo")
```

---

## ⚙️ Step 1 — Install dependencies (web app)

```bash
cd /path/to/directo
npm install
```

New packages:
- `@anthropic-ai/sdk@^0.32.1`
- `razorpay@^2.9.5`

---

## 🔐 Step 2 — Environment variables

Project root mein `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx...      # ⚠️ NEW — required for extension API auth

# Anthropic
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxx

# Razorpay (test mode for dev)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
```

### ⚠️ Important — Supabase SERVICE ROLE KEY:
Extension authentication ke liye SERVICE_ROLE_KEY chahiye (RLS bypass karke token verify karta hai).
- Supabase Dashboard → **Settings → API** → **service_role** key copy kar
- Server-only — NEVER expose to client/extension

### Anthropic key:
1. https://console.anthropic.com/ → sign up
2. Settings → API Keys → **Create Key**
3. Add billing ($5 min) warna 401 error

### Razorpay keys:
1. https://razorpay.com/ → account banao
2. Dashboard → **Test Mode** ON (top-right toggle)
3. Settings → API Keys → **Generate Test Key**

---

## 🗄️ Step 3 — Supabase SQL migrations

Supabase Dashboard → **SQL Editor → New Query**.

In **order** mein chala (1 → 2 → 3 → 4):

| File | Kya add karta hai |
|------|-------------------|
| `db/migrations/001_ai_generations.sql` | `ai_generations` table + quota tracking + `profiles.plan` column |
| `db/migrations/002_admin_dashboard.sql` | `profiles.is_admin` + admin RPCs (`admin_usage_*`) |
| `db/migrations/003_billing.sql` | `billing_payments` + `profiles.plan_cycle/renews_at` |
| `db/migrations/004_ext_tokens.sql` | `ext_tokens` + `submissions.submitted_via` |
| `db/migrations/005_submission_verification.sql` | New status hierarchy + `submissions.verified` + `verification_method` |

### Khud ko admin banane ke liye:
```sql
UPDATE profiles SET is_admin = true 
WHERE email = 'tera-email@gmail.com';
```

---

## ▶️ Step 4 — Local dev server

```bash
npm run dev
```

URLs:
- 🏠 `http://localhost:3000` — landing
- 💸 `http://localhost:3000/pricing` — pricing + Razorpay checkout
- ✍️ `http://localhost:3000/dashboard/content` — AI content generator
- 🧩 `http://localhost:3000/dashboard/extension` — extension pairing UI
- 🛡️ `http://localhost:3000/dashboard/admin` — cost dashboard (admins only)

---

## 🧩 Step 5 — Chrome extension load & test

### Load extension in Chrome:
1. Chrome → `chrome://extensions/`
2. Toggle **Developer mode** ON (top-right)
3. Click **Load unpacked**
4. Select the `extension/` folder from project
5. Pin the Directo icon to toolbar (📌 next to omnibox)

### Pair with your account:
1. Open `http://localhost:3000/dashboard/extension`
2. Click **+ Generate new token** → copy
3. Click Directo extension icon in toolbar
4. Paste token → click **Connect**
5. Should see ✓ Connected with your product details

### Test autofill:
1. Visit `https://www.producthunt.com/posts/new` (or any supported directory submit page)
2. Bottom-right mein **Directo widget** appear hoga
3. Click **⚡ Autofill Product Hunt form**
4. Form fields auto-bhar jaayenge
5. CAPTCHA / review tu khud kar → submit
6. Status auto-sync ho jayega Directo dashboard pe (Directories page)

### Supported directories (v0.1):
- Product Hunt, BetaList, SaaSHub, AlternativeTo, IndieHackers
- Uneed.best, Toolify.ai, There's an AI For That

---

## 🧪 Step 6 — End-to-end testing

### AI generation:
1. Login → complete onboarding (product details)
2. `/dashboard/content` → tone select → "Generate" click
3. Different posts dikhne chahiye per platform with cost badges

### Razorpay test card:
```
Card:    4111 1111 1111 1111
CVV:     123
Expiry:  12/30
OTP:     any 6 digits
```
1. `/pricing` → Pro plan → "Upgrade →"
2. Razorpay popup → test card → success
3. Dashboard auto-redirect, plan upgraded

### Admin dashboard:
1. SQL chala ke khud ko admin banao (Step 3)
2. Sidebar mein "🛡️ Admin · Cost" appear hoga
3. Cost vs revenue real-time dikhega

---

## 🚀 Step 7 — Production deploy

### Vercel (web app):
```bash
git push origin main
```
Vercel auto-deploys. Settings → Environment Variables mein saari keys add kar.

⚠️ Razorpay **Live Mode keys** use kar production mein (KYC complete karke).

### Chrome Web Store (extension):
1. Update `extension/manifest.json`:
   - `host_permissions` mein `https://*.directo.app/*` confirm kar
2. Update `extension/popup/welcome.html` and `extension/lib/api.js` ka `DEFAULT_BASE` → production URL
3. ZIP banao:
   ```bash
   cd extension
   zip -r ../directo-extension-v0.1.0.zip . -x "*.md"
   ```
4. https://chrome.google.com/webstore/devconsole → upload ZIP
5. Filling out store listing: ~3-7 days review

---

## 💡 Pricing (decided)

| Plan | Price | Quota | Model |
|------|-------|-------|-------|
| Free | ₹0 | 5/mo | Haiku |
| **Pro** ⭐ | ₹999/mo · ₹9,999/yr | 100/mo | Sonnet 4.5 |
| Scale | ₹2,499/mo · ₹24,999/yr | 500/mo + Opus | Sonnet/Opus |
| Founding Lifetime | ₹14,999 once | 50/mo forever | Sonnet |

**Margin target: 80%+** — admin dashboard pe live track hoga.

---

## 🐛 Troubleshooting

| Problem | Fix |
|---------|-----|
| `ANTHROPIC_API_KEY missing` | `.env.local` mein add + restart dev server |
| `Razorpay not configured` | Both RAZORPAY_KEY_ID + KEY_SECRET set kar |
| Admin link nahi dikhta | `UPDATE profiles SET is_admin=true WHERE email=...` |
| Extension "NOT_CONNECTED" | Generate fresh token, paste in extension popup |
| Extension `API_401` | `SUPABASE_SERVICE_ROLE_KEY` missing in `.env.local` |
| Filler "Filled 0 fields" | Directory ne markup change kiya — `extension/content/fillers/<name>.js` update kar |
| Generation `quota_exceeded` | Plan upgrade OR truncate `ai_generations` table |
| Razorpay "Invalid signature" | KEY_SECRET galat — Razorpay dashboard se re-copy |
| `@/lib/...` resolve error | `tsconfig.json` mein `"@/*": ["./*"]` set hai check kar |
| Extension icon missing | Re-load extension from `chrome://extensions/` |

---

## 📋 Roadmap status

- [x] ✅ AI content generation (real Claude API)
- [x] ✅ Admin cost dashboard
- [x] ✅ Razorpay billing + pricing page
- [x] ✅ Chrome extension (8 directories supported)
- [ ] 📨 Launch calendar (`/dashboard/workspace` upgrade)
- [ ] 🎨 Landing page polish (`/` redesign with pricing + features)
- [ ] 📧 Email notifications (Resend integration)
- [ ] 🔔 Razorpay webhook (auto-renew)
- [ ] 🧩 Extension: add 20+ more directory fillers
- [ ] 🏪 Submit to Chrome Web Store

---

## 🤝 Bhai, agla step?

1. **Landing page redesign** with pricing + features
2. **Launch calendar** strategic scheduling
3. **More directory fillers** for extension (next 20)
4. **Webhooks** for auto-renew billing

Bata kya soch raha hai. Sab files iss workspace mein hain — `Download Project` se ZIP utha le. ✌️
