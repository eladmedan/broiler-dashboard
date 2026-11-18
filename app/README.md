# Broiler Dashboard

React + TypeScript (Vite) implementation of the `Broiler Dashboard.html` design exported from Claude Design (source files in `../project`, design intent in `../chats`).

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check + production build into dist/
```

## Structure

- `src/App.tsx` — page shell with the client-facing **Options** panel (screen, connected devices, house view, air-flow states), docked right and remembered in `localStorage`.
- `src/components/BroilerDashboard.tsx` — the dashboard: SaaS sidebar, house header, responsive widget grid (L/M/S sizing per screen and device count), expanding overlay, Menu / alarms panels, mortality modal and toast.
- `src/components/DashboardWidget.tsx` — every dashboard widget (Temperature, Air flow, Air quality, Silos, Light, Water & feed, Birds…).
- `src/components/WidgetDrawer.tsx` — the drill-down overlay pages for each category.
- `src/components/HouseScheme.tsx` — the top-view house scheme widget.
- `src/styles/industry.css` — the "Industry" design-system tokens and component classes.
- `src/dc.ts` — helpers (`css()`, `pseudo()`, `cx()`) that keep the port faithful to the prototype markup.

All figures are mock data from the prototype.
