# 🧹 Cleanup Guide — Remove Old `src/` Folder

> **Tere 5 ghante ke debug ka root cause:** GitHub repo aur laptop par `src/` folder + root folder DONO mein duplicate files hain. Next.js dono compile kar raha tha = conflicts = chaos.

## ✅ Iss workspace mein → ALREADY CLEAN
- Sirf root-level structure: `app/`, `lib/`, `extension/`, `components/`, etc.
- Koi duplicate `src/` folder NAHI hai
- `tsconfig.json` mein `"@/*": ["./*"]` correct hai

## ❌ Tere laptop / GitHub par → STILL DUPLICATED
GitHub tree par confirm kiya — wahaan `src/app/...` aur `app/...` dono exist karte hain.

---

## 🚀 ONE-TIME CLEANUP (5 minutes)

### Local laptop par:

```bash
cd /path/to/directo

# 1. Pura src/ folder delete kar (purana version)
rm -rf src/

# 2. tsconfig.json check kar — yeh hona chahiye:
cat tsconfig.json | grep paths
# Output should be: "@/*": ["./*"]
# Agar "./src/*" dikhe to manually fix kar

# 3. node_modules + .next cache wipe kar
rm -rf node_modules .next

# 4. Fresh install
npm install

# 5. Dev server chalao
npm run dev
```

### GitHub par push:

```bash
git add -A
git status                 # confirm src/ deletion show ho raha hai
git commit -m "chore: remove duplicate src/ folder, use root structure only"
git push origin main
```

---

## 🔍 Verify cleanup worked:

```bash
# Yeh saare commands EMPTY output dene chahiye:
ls src/ 2>/dev/null && echo "STILL EXISTS — DELETE AGAIN"
find . -path ./node_modules -prune -o -name "page.tsx" -print | grep src/
```

Agar koi output nahi aaya = ✅ clean

---

## 📁 Tera **canonical** project structure (yeh sahi hai):

```
directo/
├── app/                          ← Next.js App Router (root level)
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── api/
│   ├── pricing/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/                          ← shared utilities
│   ├── ai/
│   ├── billing/
│   ├── supabase/
│   └── ext-auth.ts
├── components/ui/                ← shadcn components
├── db/migrations/                ← SQL migrations (001-005)
├── extension/                    ← Chrome extension
│   ├── background/
│   ├── content/
│   ├── lib/
│   ├── popup/
│   ├── icons/
│   └── manifest.json
├── public/                       ← static assets
├── middleware.ts
├── next.config.ts
├── package.json
├── tsconfig.json                 ← "@/*": ["./*"]
└── .env.local                    ← (gitignored)
```

**Important:** `src/` folder NOWHERE hona chahiye.

---

## 🚨 Agar git push pe error aaye:

Agar GitHub bole "deletion conflicts" → force push:
```bash
git push origin main --force
```

⚠️ **Force push sirf tab kar jab confirm hai ki koi aur kaam nahi kar raha repo par.**

---

## ✅ After cleanup, dev server clean chalega:

- Koi `Module not found` error nahi
- Koi duplicate route warning nahi
- Sirf ek `page.tsx` per route
- Fast hot reload

Phir SETUP.md ke baaki steps follow kar:
1. `.env.local` setup
2. 5 SQL migrations chala (Supabase)
3. Extension load karke pair kar
4. Test kar

Hogaya bhai — 5 ghanta gone, ab smooth sailing. 🛟
