# Metadata Explorer Backend Handoff

## Overview
The frontend route `/graph` has been rewritten as a Metadata Explorer workflow.

This document is updated to match the latest required backend contract with minimal, targeted graph-layer changes only.

Non-goals:
- Do not modify SQL onboarding flow behavior.
- Do not modify Cosmos onboarding flow behavior.
- Do not modify Kafka onboarding flow behavior.

## Current Frontend Behavior (Implemented)
- Hierarchy flow is: Domain -> Sub Domain -> Store Type -> Store -> Schema -> Asset.
- Schema dropdown is populated from selected store.
- Asset dropdown is populated from selected schema.
- Asset dropdown prefers `Table` rows when tables are present in the selected schema.
- Column-level editing is done inline in the grid (no table-level description editor).
- Bulk save sends only changed column rows.
- For every changed column row, frontend sends `llm_confidence: 1`.
- Data Steward name is manually entered by the user.
- `process-approved` is still available as a separate action.

User flow:
1. Select Domain
2. Select Sub Domain
3. Select Store Type (`Database` or `CosmosDatabase`)
4. Select Store (`Database` or `Cosmos Database`)
5. Select Schema
6. Select Asset
7. View selected asset details
8. Show all column nodes for selected table in a grid
9. Edit column-level business description directly in each row
10. Perform bulk save for updated column descriptions
11. Enter Data Steward name and trigger process approved action

## Endpoints Required

### 1) Get hierarchy for selectors
- Method: `GET`
- Path: `/api/graph/metadata-explorer/hierarchy`
- Response:

```json
{
  "domains": [
    {
      "id": "domain-sales",
      "name": "Sales",
      "sub_domains": [
        {
          "id": "subdomain-order-management",
          "name": "Order Management",
          "stores": [
            {
              "id": "sql-sales-db",
              "name": "SalesDB",
              "store_type": "Database",
              "schemas": [
                {
                  "id": "dbo",
                  "name": "dbo",
                  "assets": [
                    {
                      "id": "dbo.orders",
                      "name": "orders",
                      "asset_type": "Table"
                    }
                  ]
                }
              ]
            },
            {
              "id": "cosmos-sales-analytics",
              "name": "SalesAnalytics",
              "store_type": "CosmosDatabase",
              "schemas": [
                {
                  "id": "default",
                  "name": "Default",
                  "assets": [
                    {
                      "id": "customers_collection",
                      "name": "customers",
                      "asset_type": "Collection"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

Rules:
- Return only valid combinations so each dropdown is naturally constrained.
- `store_type` must be exactly `Database` or `CosmosDatabase`.
- Each store must return `schemas`.
- Each schema must return `assets`.
- `asset_type` must be exactly `Table` or `Collection`.
- For Cosmos sources, backend may return a synthetic schema such as `Default` when no natural schema exists.

Compatibility note:
- Frontend currently supports a temporary fallback that can derive schemas from legacy `store.assets` payloads.
- Backend target contract should still be `store.schemas[].assets[]`.

### 2) Get selected asset detail from graph DB
- Method: `GET`
- Path: `/api/graph/metadata-explorer/assets/{assetId}`
- Response:

```json
{
  "asset_id": "dbo.orders",
  "name": "orders",
  "data_type": "N/A",
  "business_description": "Contains sales order header data.",
  "llm_confidence": 0.92,
  "approved_descriptions": [
    {
      "description": "Approved business definition for orders.",
      "approved_by": "steward@company.com",
      "approved_at": "2026-03-18T09:30:00Z",
      "confidence": 0.95
    }
  ],
  "columns": [
    {
      "column_id": "dbo.orders.order_id",
      "name": "order_id",
      "data_type": "bigint",
      "business_description": "Unique order identifier.",
      "llm_confidence": 0.97,
      "approved_descriptions": [
        {
          "description": "Approved definition for order id.",
          "approved_by": "steward@company.com",
          "approved_at": "2026-03-17T18:22:00Z",
          "confidence": 0.98
        }
      ]
    }
  ]
}
```

Rules:
- `llm_confidence` is expected as decimal `0.0 - 1.0` (frontend renders percentage).
- Any nullable text should be `null` when absent.
- `approved_descriptions` should be an empty array when none exist.
- Include `columns` for table assets.
- Return `columns: []` for non-table assets (for example, collection assets).
- Keep field names exactly: `column_id`, `name`, `data_type`, `business_description`, `llm_confidence`, `approved_descriptions`.

### 3) Bulk update column descriptions (primary write endpoint for current UI)
- Method: `POST`
- Path: `/api/graph/metadata-explorer/assets/{assetId}/columns/business-description/bulk`
- Request:

```json
{
  "steward": "Jane Doe",
  "columns": [
    {
      "column_id": "dbo.orders.order_id",
      "business_description": "Unique order identifier",
      "llm_confidence": 1
    },
    {
      "column_id": "dbo.orders.customer_id",
      "business_description": "Identifier of ordering customer",
      "llm_confidence": 1
    }
  ]
}
```

- Response:

```json
{
  "message": "Column descriptions bulk-updated"
}
```

Rules:
- Keep request field names exactly `steward`, `columns`, `column_id`, `business_description`, `llm_confidence`.
- Persist all provided rows in one operation (transaction/batch semantics preferred).
- Backend must persist `llm_confidence = 1` for each updated column row.
- Frontend sends only changed rows in this bulk payload.
- Return `detail` error shape if any row fails validation.

Backend implementation expectation for confidence:
- If `business_description` is updated through this endpoint, persist `llm_confidence = 1` for that same column.
- Response from subsequent `GET /api/graph/metadata-explorer/assets/{assetId}` must return the updated confidence value as `1`.

### 4) Process approved descriptions for selected asset
- Method: `POST`
- Path: `/api/graph/metadata-explorer/assets/{assetId}/process-approved`
- Request:

```json
{
  "requested_by": "Jane Doe"
}
```

- Response:

```json
{
  "message": "Approved description processing started"
}
```

Rules:
- This endpoint can run synchronous or enqueue async processing.
- Message should clearly indicate start/completion status.

## Error Handling Contract
- For non-2xx responses, return JSON body in a readable `detail` shape.
- Frontend already renders either string or JSON object from error payload.

Suggested error shape:

```json
{
  "detail": "Human-readable error message"
}
```

or

```json
{
  "detail": {
    "error": "Detailed validation or server error",
    "status_code": 400
  }
}
```

## Graph Modeling Guidance (for backend implementation)
Use or map labels/relations so hierarchy can be resolved consistently:
- Domain -> SubDomain
- SubDomain -> Database or CosmosDatabase
- Database -> Schema -> Table
- CosmosDatabase -> Schema -> Collection
- Table -> Column
- Asset node stores: business description, data type, LLM confidence, and approval history references

If existing labels differ (e.g., `Department` instead of `Domain`), map them in API DTOs so frontend contract remains stable.

## Path Parameter and CORS Requirements
- Support encoded/special IDs in `{assetId}` (for example slash or dot) by decoding path params safely.
- Preserve existing CORS behavior.

## Layering and Scope
- Keep changes isolated to graph/metadata explorer API, service, and repository layers.
- Do not introduce package installs.

## Test Requirements
Add or update API tests for all required endpoints:
- `GET /api/graph/metadata-explorer/hierarchy`
- `GET /api/graph/metadata-explorer/assets/{assetId}`
- `POST /api/graph/metadata-explorer/assets/{assetId}/columns/business-description/bulk`
- `POST /api/graph/metadata-explorer/assets/{assetId}/process-approved`

Minimum assertions:
- Hierarchy response returns only valid constrained combinations.
- `store_type` is only `Database` or `CosmosDatabase`.
- Each selected store returns schemas and each schema returns assets.
- `asset_type` is only `Table` or `Collection`.
- Asset detail response contains required top-level fields.
- Asset detail returns `columns` array for selected table assets.
- Each column has required fields and `approved_descriptions` array.
- Process endpoint returns `message: Approved description processing started`.
- Bulk endpoint persists per-row column descriptions and returns success `message`.
- Bulk endpoint persists `llm_confidence = 1` for each updated column.
- A follow-up `GET /api/graph/metadata-explorer/assets/{assetId}` should return updated column descriptions with `llm_confidence: 1` for the edited rows.
- Bulk endpoint rejects invalid rows with `detail` payload.
- Error payloads retain `detail` shape.

Recommended additional assertions:
- Only changed rows are required in bulk request; unchanged rows should remain untouched.
- Special/encoded `{assetId}` values are correctly resolved.
- Schema list for selected store is non-empty when source has relational metadata.

## Frontend Files Updated
- `app/graph/page.tsx`
- `services/graphService.ts`
- `types/api.ts`

## Notes for Backend AI Agent
- Keep endpoint and field names exactly as documented to avoid frontend rework.
- If IDs include special characters (`/`, `.`), route handling must support encoded path params.
- Ensure CORS allows frontend origin (typically `http://localhost:3000`).
