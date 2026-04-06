# Eagle Event 🚀

Landing page responsiva para o evento Eagle (IFCE Cedro).

## 🚀 Quick Start (Development)

```bash
# 1. Clone & Install
git clone <repo> eagleForm
cd eagleForm
npm install

# 2. Config env
cp .env.example .env
# Edit .env (DB, SMTP, ADMIN_PASS)

# 3. Migrate DB (if using PostgreSQL)
npm run db:migrate  # Add script or use pg_dump eagle.sql

# 4. Dev server (backend + frontend)
npm run dev

# OR Static only (public/)
npm run serve
```

## 📱 Features
- ✅ **Fully Responsive** (320px+ iPhone SE → Desktop, no horizontal scroll)
- Backend: Express + PostgreSQL/SQLite + Rate Limit + Helmet
- Frontend: Vanilla JS + Particles + AOS + SweetAlert
- Minicursos inscriptions (real-time polling)
- Admin dashboard (teams/minicursos)
- Vercel/Netlify ready

## 🛠 Commands
| Script | Description |
|--------|-------------|
| `npm start` | Production server |
| `npm run dev` | Hot reload w/ nodemon |
| `npm run serve` | Static preview `public/` |
| `npm run deploy` | Vercel deploy |

## 🌐 Deployment
```bash
npm i -g vercel
vercel --prod
```

## 📊 Tech Stack
```
Frontend: HTML/CSS/JS (Vanilla + Particles.js + AOS)
Backend: Node.js/Express/PostgreSQL/SQLite
Deploy: Vercel/Netlify
Dev: ESLint/Nodemon
```

**Responsiveness validated** - Zero issues on mobile! 🎉
