# Metadata Discovery Hub

Frontend control plane for the Cognitive Metadata Platform.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Typed service clients via native `fetch`

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Configure API base URL (optional, defaults to `http://localhost:8000`):

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. Run the app:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

## Feature Routes

- `/` Overview and platform entry point
- `/dashboard` Health probes, graph stats, schema, and metrics preview
- `/graph` Metadata Explorer with schema-based hierarchy, column-level editing, and bulk updates
- `/node-search` Node search (`/api/graph/nodes/search`)
- `/llm` LLM Studio (`/api/llm/generate`, `/api/llm/answer`)
- `/relationships` Graph relationship manager (`/api/relationship/manual`)
- `/onboard/sql` SQL metadata onboarding
- `/onboard/cosmos` Cosmos DB onboarding
- `/onboard/kafka` Kafka onboarding

## API Layer

Type contracts are centralized in:

- `types/api.ts`

Service clients:

- `services/api.ts` (base request helper + error type)
- `services/systemService.ts`
- `services/graphService.ts`
- `services/onboardService.ts`
- `services/llmService.ts`
- `services/relationshipService.ts`

## Validation

Run lint checks:

```bash
npm run lint
```
