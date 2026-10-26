# Coworking Pass — Frontend

Next.js 16 (App Router) web application with React 19, TypeScript and Tailwind CSS 4. Runs on port **3000** and talks to the backend API (`NEXT_PUBLIC_API_URL`, default `http://localhost:3001`).

```bash
npm install
cp .env.example .env
npm run dev              # http://localhost:3000
```

Useful scripts: `npm run build`, `npm run lint`, `npx playwright test` (end-to-end tests in `tests/`).

- Screens live in `app/` (`individual/`, `organization/`, `provider/`, `admin/`, `spaces/`).
- Translations live in `i18n/` (`ar.json`, `en.json`); add every new string to both files.
- API client: `services/authApi.ts`; domain types and booking helpers: `types/types.tsx`.

See the [root README](../README.md) for the full project overview and the [documentation](../docs/).
