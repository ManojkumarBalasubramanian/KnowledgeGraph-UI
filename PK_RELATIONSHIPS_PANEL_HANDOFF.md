# PK Relationships Panel — Frontend Handoff

**Status:** Backend Implemented  
**Route:** `http://localhost:3000/relationships` → Foreign Key Relationships tab  
**Last Updated:** 2026-03-18 (full table identity upgrade)

---

## Feature Summary

When a user selects a **Primary Key Table** in the FK Relationship form, a read-only panel should appear below the PK section listing all existing relationships from that table. This gives the user context — they can see what FK relationships already exist before creating a new one.

**Excluded by backend:** All structural graph traversal relationships (`HAS_COLUMN`, `HAS_SCHEMA`, `HAS_TABLE`, `HAS_CONTAINER`, `HAS_TOPIC`). Only semantic relationships are returned to the UI.

**Does not block form flow** — the panel is informational only; the FK creation form below it is fully independent.

---

## Backend Endpoint Available

### Get Table Relationships

**URL:** `GET /api/relationship/tables/{tableName}/relationships`

**Method:** GET

**Backend Status:** Implemented and ready for UI integration.

**Path Parameter:**
- `tableName` (string) — e.g., `CUST`

**Optional Query Parameters:**
| Parameter | Type | Description |
|---|---|---|
| `schema` | string | Schema name (e.g., `dbo`) — strongly recommended |
| `database` | string | Database name (e.g., `iwmsproddb`) — strongly recommended |

> **Why these matter:** Tables are stored in Neo4j with a 4-part identity (`name + schema + database`). If the same table name (`CUST`) exists in multiple databases or schemas, omitting `schema` and `database` may match the wrong node and return empty results. Always pass both when your form already knows the full database→schema→table context (which it does from the hierarchy dropdown).

**Response (HTTP 200):**
```json
{
  "table_name": "iwms_region",
  "relationships": [
    {
      "relationship_type": "FOREIGN_KEY_REFERENCES",
      "direction": "incoming",
      "related_table": "iwms_location",
      "pk_column": "id",
      "fk_column": "region_id",
      "cardinality": "One-to-Many",
      "created_at": "2026-03-18T10:00:00Z"
    },
    {
      "relationship_type": "FOREIGN_KEY_REFERENCES",
      "direction": "incoming",
      "related_table": "iwms_building",
      "pk_column": "id",
      "fk_column": "region_id",
      "cardinality": "One-to-Many",
      "created_at": "2026-03-18T11:00:00Z"
    },
    {
      "relationship_type": "RELATED_TO",
      "direction": "outgoing",
      "related_table": "iwms_country",
      "pk_column": null,
      "fk_column": null,
      "cardinality": null,
      "created_at": null
    }
  ]
}
```

**Empty Response (no relationships found):**
```json
{
  "table_name": "iwms_region",
  "relationships": []
}
```

---

## Response Field Definitions

| Field | Type | Description |
|---|---|---|
| `table_name` | string | The queried table name |
| `relationships` | array | All non-structural relationships for this table |
| `relationship_type` | string | Neo4j relationship label (e.g., `FOREIGN_KEY_REFERENCES`) |
| `direction` | `"incoming"` \| `"outgoing"` | Whether the selected table is the PK (incoming FK) or the FK table (outgoing) |
| `related_table` | string | Name of the other table in the relationship |
| `pk_column` | string \| null | PK column name — populated for `FOREIGN_KEY_REFERENCES`, null otherwise |
| `fk_column` | string \| null | FK column name — populated for `FOREIGN_KEY_REFERENCES`, null otherwise |
| `cardinality` | string \| null | `"One-to-One"`, `"One-to-Many"`, `"Many-to-Many"`, or null |
| `created_at` | string \| null | ISO 8601 datetime string or null |

---

## Cypher Query Pattern

```cypher
MATCH (t:Table {name: $tableName})
MATCH (t)-[rel]-(other:Table)
WHERE NOT type(rel) IN ['HAS_COLUMN', 'HAS_SCHEMA', 'HAS_TABLE', 'HAS_CONTAINER', 'HAS_TOPIC']

RETURN {
  relationship_type: type(rel),
  direction: CASE WHEN startNode(rel) = t THEN 'outgoing' ELSE 'incoming' END,
  related_table: other.name,
  pk_column: rel.pk_column,
  fk_column: rel.fk_column,
  cardinality: rel.relationship_type,
  created_at: toString(rel.created_at)
} AS relationship
ORDER BY relationship.relationship_type, relationship.related_table
```

**Key rules:**
- Use `$tableName` as a Cypher parameter (not string interpolation)
- Match both directions with `-[rel]-` (undirected) to capture incoming FK references and outgoing references
- `direction` is derived from whether the queried table is `startNode` or `endNode`
- `rel.pk_column`, `rel.fk_column`, `rel.relationship_type` come from properties set during `FOREIGN_KEY_REFERENCES` creation
- Return empty array when no relationships exist — **never return 404 for this endpoint**
- Do not add extra UI-side filtering for structural relationship types; the backend already excludes them

---

## Frontend Integration

### Where the Panel Appears

The panel is inserted **between the PK section and the FK section** inside the FK tab form. It is conditionally rendered — only shown when `pkTable` state is set and a response has been received.

```
┌─────────────────────────────────────────────┐
│  Primary Key Table                          │
│  [Database] [Schema] [Table] [Column]       │
└─────────────────────────────────────────────┘
                       ↓ pkTable has a value
┌─────────────────────────────────────────────┐  ← NEW PANEL (conditional)
│  Existing Relationships for iwms_region     │
│  ┌──────────────────────────────────────┐   │
│  │ → iwms_location.region_id  FK  1:M   │   │
│  │ → iwms_building.region_id  FK  1:M   │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────┐
│  Foreign Key Table                          │
│  [Database] [Schema] [Table] [Column]       │
└─────────────────────────────────────────────┘
```

### Trigger Condition

The panel loads whenever `pkTable` state changes to a non-empty value. This happens inside the existing `handlePkTableChange` handler. Pass `pkSchema` and `pkDatabase` from the hierarchy form state alongside `pkTable`.

```typescript
// Current handler in app/relationships/page.tsx
const handlePkTableChange = (newTable: string) => {
  setPkTable(newTable);
  setPkColumn("");
  // ← fetchPkRelationships(newTable, pkSchema, pkDatabase) added here
};
```

If `newTable` is empty:

- clear `pkRelationships`
- stop rendering the panel
- skip the API call

### New State Required

```typescript
// Add to RelationshipsPage component state
const [pkRelationships, setPkRelationships] = useState<TableRelationshipItem[]>([]);
const [isLoadingPkRelationships, setIsLoadingPkRelationships] = useState(false);
```

### New Types Required (add to `types/api.ts`)

```typescript
export interface TableRelationshipItem {
  relationship_type: string;
  direction: "incoming" | "outgoing";
  related_table: string;
  pk_column: string | null;
  fk_column: string | null;
  cardinality: string | null;
  created_at: string | null;
}

export interface TableRelationshipsResponse {
  table_name: string;
  relationships: TableRelationshipItem[];
}
```

### New Service Method Required (add to `services/relationshipService.ts`)

```typescript
export const getTableRelationships = async (
  tableName: string,
  schema: string,
  database: string,
): Promise<TableRelationshipsResponse> => {
  const params = new URLSearchParams({ schema, database });
  return api.get<TableRelationshipsResponse>(
    `/api/relationship/tables/${tableName}/relationships?${params}`
  );
};
```

Passing `schema` and `database` ensures the correct Neo4j node is matched when the same table name exists in multiple databases/schemas.

---

## Panel Loading States

| State | UI Behavior |
|---|---|
| `pkTable` is empty | Panel not rendered at all |
| `isLoadingPkRelationships === true` | Show inline spinner: "Loading relationships..." |
| `relationships.length === 0` | Show muted message: "No existing relationships for this table" |
| `relationships.length > 0` | Render relationship rows (see layout below) |
| Fetch error | Show muted warning: "Could not load existing relationships" — **form stays usable** |

---

## Panel Layout Specification

```
┌────────────────────────────────────────────────────────────────┐
│  Existing Relationships   [iwms_region]                        │
│  ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ─  │
│                                                                 │
│  DIRECTION  RELATED TABLE         COLUMNS           CARDINALITY│
│  ────────── ─────────────────── ──────────────────  ──────────│
│  ← incoming  iwms_location       id ← region_id     1:M       │
│  ← incoming  iwms_building       id ← region_id     1:M       │
│  → outgoing  iwms_country        —                  —         │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Direction display:**
- `incoming` → `← incoming` (FK table points TO this PK table)
- `outgoing` → `→ outgoing` (this table points TO another table)

**Column display logic:**
- If `pk_column` and `fk_column` are both present: show as `{pk_column} ← {fk_column}`
- Otherwise: show `—`

**Cardinality display:**
- `"One-to-Many"` → `1:M`
- `"One-to-One"` → `1:1`
- `"Many-to-Many"` → `M:N`
- `null` → `—`

---

## Fetch Behavior

- Triggered on every `pkTable` state change to a non-empty value
- Cancelled/ignored if `pkTable` resets to `""` (panel hidden, state cleared)
- Error state is **non-blocking** — panel shows warning but FK form remains fully usable
- No retry logic needed; user can re-select the PK table to re-trigger
- Render the backend response as-is; no client-side exclusion of `HAS_SCHEMA` / `HAS_COLUMN` is needed

---

## Integration Checklist (Frontend)

- [ ] Add `TableRelationshipItem` and `TableRelationshipsResponse` to `types/api.ts`
- [ ] Add `getTableRelationships(tableName, schema, database)` to `services/relationshipService.ts`
- [ ] Add `pkRelationships` and `isLoadingPkRelationships` state to `RelationshipsPage`
- [ ] Add fetch call inside `handlePkTableChange` when `newTable` is non-empty, passing `pkSchema` and `pkDatabase`; clear state when empty
- [ ] Render panel between PK section and FK section in FK tab JSX
- [ ] Handle loading / empty / error states gracefully (panel should never crash the page)
- [ ] Render returned relationships directly without applying an extra structural-relationship filter in the UI

---

## Backend Error Handling

- **404 for unknown table** — Return `200` with `{ "table_name": "...", "relationships": [] }` instead. The UI does not need to distinguish "table exists, no relationships" from "table not found".
- **500 errors** — Frontend silently hides the panel and displays a muted warning. Form stays usable.
- **Malformed data** — `pk_column`, `fk_column`, `cardinality`, `created_at` may all be null safely; the frontend handles this.

---

## Backend Notes for UI Team

- The backend route is already implemented and upgraded to support full table identity matching.
- The response already excludes `HAS_SCHEMA`, `HAS_COLUMN`, `HAS_TABLE`, `HAS_CONTAINER`, and `HAS_TOPIC`.
- **Always pass `schema` and `database` query params** — tables are keyed by `name + schema + database` in Neo4j. Omitting them may return empty results for tables that share a name across multiple schemas/databases (e.g., `CUST` in `dbo` vs another schema).
- The form already collects database → schema → table context from the hierarchy dropdown — use those values directly.
- If the panel shows `Could not load existing relationships`, inspect the network call to `/api/relationship/tables/{tableName}/relationships?schema=...&database=...` and capture the backend response body.
