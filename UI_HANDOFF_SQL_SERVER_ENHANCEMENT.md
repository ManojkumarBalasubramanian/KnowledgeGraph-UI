# UI Handoff - SQL Server Enhancement

**Date**: March 17, 2026
**Scope**: SQL onboarding UX updates for schema/table targeting and delta onboarding.

## Objective
Enable users to onboard a specific SQL table instead of the full database and default to delta-only ingestion for already onboarded Neo4j data.

## Backend Changes Available
1. `POST /api/onboard/sql/catalog`
2. `POST /api/onboard/sql` with new request fields:
   - `schema_name` (optional)
   - `table_name` (optional)
   - `delta_only` (optional, default `true`)

## API Contracts

### 1) Fetch schema/table catalog
Endpoint:
`POST /api/onboard/sql/catalog`

Request:
```json
{
  "connection_string": "DRIVER={ODBC Driver 18 for SQL Server};SERVER=...;DATABASE=...;UID=...;PWD=...;Encrypt=yes;"
}
```

Response:
```json
{
  "schemas": [
    {
      "schema": "dbo",
      "tables": ["orders", "products", "inventory"]
    }
  ]
}
```

### 2) Start SQL onboarding
Endpoint:
`POST /api/onboard/sql`

Request (specific table, delta mode):
```json
{
  "connection_string": "DRIVER={ODBC Driver 18 for SQL Server};SERVER=...;DATABASE=...;UID=...;PWD=...;Encrypt=yes;",
  "schema_name": "dbo",
  "table_name": "orders",
  "delta_only": true
}
```

Request (full DB refresh behavior):
```json
{
  "connection_string": "DRIVER={ODBC Driver 18 for SQL Server};SERVER=...;DATABASE=...;UID=...;PWD=...;Encrypt=yes;",
  "delta_only": false
}
```

Validation rule:
- If `table_name` is provided without `schema_name`, API returns HTTP 400.

Response:
```json
{
  "message": "SQL onboarding started in background",
  "schema_name": "dbo",
  "table_name": "orders",
  "delta_only": true
}
```

## UI Changes Required
1. Add a "Load Schema/Table" action that calls `POST /api/onboard/sql/catalog`.
2. Add a `Schema` dropdown populated from `schemas[].schema`.
3. Add a `Table` dropdown populated from the selected schema's `tables[]`.
4. Add a toggle/checkbox: `Delta only (skip already onboarded columns)` default `ON`.
5. Submit `schema_name`, `table_name`, and `delta_only` in `POST /api/onboard/sql`.
6. Keep a "Full database" option by leaving schema/table empty.

## UX Notes
1. Disable `Table` dropdown until a schema is selected.
2. If catalog call fails, allow manual entry mode (optional fallback).
3. Show non-blocking status message because onboarding runs in the background.
4. Explain delta mode in helper text: "Only new columns are added to Neo4j; existing columns are skipped."

## Suggested TypeScript Types
```typescript
export type SqlCatalogRequest = {
  connection_string?: string;
};

export type SqlCatalogResponse = {
  schemas: Array<{
    schema: string;
    tables: string[];
  }>;
};

export type SqlOnboardRequest = {
  connection_string?: string;
  schema_name?: string;
  table_name?: string;
  delta_only?: boolean; // default true
};

export type SqlOnboardResponse = {
  message: string;
  schema_name?: string | null;
  table_name?: string | null;
  delta_only: boolean;
};
```

## Acceptance Criteria
1. User can onboard one specific table via schema+table selectors.
2. Default mode is delta-only and does not reprocess existing Neo4j columns.
3. User can explicitly disable delta mode for refresh behavior.
4. UI surfaces the 400 validation error when table is selected without schema.
5. Existing onboarding flow remains functional when schema/table are omitted.
