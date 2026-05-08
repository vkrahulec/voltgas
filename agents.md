# Agents

## Claude Code Guidelines

### Monorepo Structure
- Root uses **npm workspaces** — internal packages are referenced with `"*"`, not `"workspace:*"` (that is pnpm/Yarn Berry syntax)
- Workspaces: `apps/mobile`, `api`, `packages/types`
- Shared types live in `packages/types` and are imported as `@voltgas/types`

### Tech Stack
- **API**: Vercel serverless functions (`api/*.ts`) — each file must export a default `handler(req, res)` function; plain data exports will fail
- **Mobile**: Expo SDK 52, React Native, TypeScript
- **Types**: Shared `Station` interface in `packages/types/index.ts`

### Key Rules
- Do **not** run `npm install` — the user executes it themselves
- Do **not** add a `functions` runtime block to `vercel.json` — Vercel handles TypeScript natively
- API routes are served under `/api/*` via the `routes` config in `vercel.json`
- The local API runs at `http://192.168.0.208:3000` (LAN IP used by the mobile app)

### Workflow
1. Edit code in the relevant workspace (`api/`, `apps/mobile/`, `packages/types/`)
2. Inform the user to run `npm install` from the repo root if `package.json` dependencies changed
3. Test API changes with `vercel dev` (serves at `http://localhost:3000`)
4. Test mobile changes with `expo start` inside `apps/mobile/`
5. Commit and push after each feature batch when the user requests it

---

## Planned App Agents

### Price Monitor Agent
Periodically fetches station prices and alerts the user when a price drops below a configured threshold. Could run as a background Vercel cron job hitting `/api/stations` and comparing against stored baselines.

### Nearest Station Agent
Given the user's GPS coordinates, ranks nearby stations by distance and price. Would use the `lat`/`lng` fields on the `Station` interface and a Haversine distance calculation.

### Fuel Type Recommender
Suggests whether the user should prefer a gas or EV station based on their vehicle profile and current prices. Input: vehicle type + current `Station[]` list. Output: ranked recommendation with reasoning.

### Price Trend Agent
Tracks historical price data over time and surfaces trends (e.g. "Gas prices up 4% this week in Brno"). Requires a persistence layer (database or Vercel KV) to store price snapshots.
