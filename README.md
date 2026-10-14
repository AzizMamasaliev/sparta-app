# SPARTA Mini App

React 18 + TypeScript + Vite. Бандл ≈ 74 КБ gzip.

```bash
npm install
npm run dev      # http://localhost:5173 — вне Telegram включается демо-режим
npm run build    # dist/ → GitHub Pages / Cloudflare Pages
```

- `src/api.ts` — запросы к `functions/v1/api` с заголовком `X-Telegram-Init-Data`, кэш, повторы. `?mock=1` или запуск вне Telegram → `src/mock/mock.ts`.
- `src/screens/` — Onboarding, Today, Train (мышцы, программы), Catalog (мышца, упражнение, программа), Player, Food, Progress, Profile (Paywall, EditProfile, Squads).
- `src/BodyMap.tsx` — SVG-силуэт спереди и сзади, 13 зон.
- `src/i18n.ts` — все тексты uz/ru.
- Демо-контент: `python3 scripts/gen_mock.py` (из `scripts/gen_content.py`).
- URL API можно переопределить: `VITE_API_URL`.
