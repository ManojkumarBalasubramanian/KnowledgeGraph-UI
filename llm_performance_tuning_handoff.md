# LLM Performance Tuning Handoff

Last updated: 2026-04-01

## Purpose
Provide an implementation handoff for synchronous GraphRAG performance tuning.

## Scope of Changes
The backend is tuned for faster synchronous GraphRAG responses while preserving existing behavior.

Implemented improvements:
1. Fixed embedding cache scope so query embeddings are reused across requests.
2. Reduced prompt token volume by truncating long business descriptions.
3. Introduced balanced context selection before prompt build to keep prompt size small while preserving SQL + Cosmos coverage.
4. Removed streaming GraphRAG path and endpoint to avoid unstable behavior and simplify operations.

## Endpoint Contract

### Active endpoint
- `POST /api/llm/graphrag`
- Returns full response as a single payload (synchronous).

### Removed endpoint
- `POST /api/llm/graphrag/stream`
- Removed by design per current backend direction.

## Performance Tuning Details

### 1) Embedding caching
- Query embedding cache is now module-scoped and reused across calls.
- Result: repeated or similar questions avoid repeated embedding latency.

### 2) Leaner prompt context
- Long `business_description` values are truncated before prompt assembly.
- Result: fewer input tokens and reduced LLM processing time.

### 3) Balanced context-node cap
- Retrieval may return many nodes (especially from mixed SQL + Cosmos sources).
- A compact prompt subset is selected before building the final prompt.
- Selection behavior:
  1. Keep both SQL and Cosmos represented when both are available.
  2. Apply a capped prompt context size (`max(4, min(top_k, 12))`).
  3. Re-sort selected nodes by similarity score before prompt generation.
- Result: lower latency without losing multi-source relevance.

## Config Knobs (No Contract Change)
- `GRAPHRAG_TOP_K_DEFAULT`
- `GRAPHRAG_MAX_CONTEXT_NODES`
- `GRAPHRAG_MIN_CONTEXT_NODES`
- `GRAPHRAG_REQUIRE_CONTEXT`
- `GRAPHRAG_EMBED_CACHE_SIZE`

## Practical Recommendations
1. Keep request `top_k` in the 8 to 12 range for interactive UX.
2. Increase `GRAPHRAG_EMBED_CACHE_SIZE` for repeated analyst queries.
3. Keep `GRAPHRAG_REQUIRE_CONTEXT=true` for strict grounding.
4. Prefer improving metadata quality over increasing prompt size.

## Backend Files Updated
- `app/services/llm_service.py`
  - Removed GraphRAG streaming helpers.
  - Added compact balanced context selector for prompt building.
  - Kept and used module-level embedding cache.
  - Kept prompt truncation for large descriptions.
  - Simplified GraphRAG timing metadata assignment.
- `app/api/llm_endpoint.py`
  - Removed `POST /llm/graphrag/stream` endpoint and streaming imports.

## Validation Checklist
1. Verify endpoint works:
   - `POST /api/llm/graphrag`
2. Verify no references to streaming endpoint in frontend code.
3. Compare latency before/after for identical prompts.
4. Confirm answers still include SQL and Cosmos details when both are relevant.

## Quick Test Command (PowerShell)

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/llm/graphrag" -ContentType "application/json" -Body '{"question":"List customer identifiers from SQL Server and Cosmos DB","top_k":10}'
```

## Rollout Notes
1. Remove or disable frontend calls to `/api/llm/graphrag/stream`.
2. Use `/api/llm/graphrag` as the only GraphRAG endpoint.
3. Monitor:
   - average total response latency
   - GraphRAG grounding failure rate
   - token usage trend
