# Local Development Setup

## When to Use
Setting up the Patient Care UI for local development for the first time, or after a clean clone.

## Prerequisites
- Node.js 18+ installed
- npm 9+ installed
- The [patient-care-api](https://github.com/anibalvelarde/patient-care-api) running locally on port 5245 (for live data)

## Steps

### 1. Clone and Install

```bash
git clone https://github.com/anibalvelarde/patient-care-ui-vue.git
cd patient-care-ui-vue/app-ui
npm install
```

### 2. Configure API URL (Optional)

The default API URL is `http://localhost:5245`. To change it, edit `app-ui/.env`:

```
VITE_API_BASE_URL=http://localhost:5245
```

### 3. Start Dev Server

```bash
npm run dev
```

The app will be available at `http://localhost:8080/`.

### 4. Browse Design Options

- Navigate to `http://localhost:8080/` to see the comparison landing page
- Click any option card to view that design
- Use "Back to Options" link in each option to return to the comparison page

### 5. Type-Check (Optional)

```bash
npx vue-tsc --noEmit
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "No appointments" on all options | API not running | Start `patient-care-api` on port 5245 |
| Port 8080 in use | Another process on that port | Change port in `vite.config.ts` or stop the other process |
| Type errors after pull | New interfaces or props | Run `npm install` then `npx vue-tsc --noEmit` |
| Tailwind classes not applying | PostCSS not processing | Restart dev server (`npm run dev`) |
