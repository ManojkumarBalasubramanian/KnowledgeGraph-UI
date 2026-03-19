# Unified Onboarding + Sub Domain Linking — Backend Handoff (SQL, Cosmos, Kafka)

**Status:** Frontend-ready contract requested
**Routes:**
- `http://localhost:3000/onboard/sql`
- `http://localhost:3000/onboard/cosmos`
- `http://localhost:3000/onboard/kafka`
**Last Updated:** 2026-03-18

---

## Goal

Use a common onboarding pattern across SQL, Cosmos, and Kafka:

1. Frontend selects `Domain -> Sub Domain` before onboarding.
2. Backend runs existing onboarding behavior per source type.
3. Backend links the selected Sub Domain to onboarded assets via source-specific relationships.
4. Relationship creation is idempotent.

---

## Shared Hierarchy Source

Use existing hierarchy endpoint:

- **GET** `/api/graph/metadata-explorer/hierarchy`

Required response fields for UI selectors:
- `domains[].id`, `domains[].name`
- `domains[].sub_domains[].id`, `domains[].sub_domains[].name`

No backend change is needed here if the shape above is already stable.

---

## Shared Request Additions

All onboarding endpoints should accept:

- `sub_domain_id` (required in this new flow)
- `domain_id` (optional, recommended for ownership validation)

Validation rules for all three endpoints:
- Missing `sub_domain_id` -> **422**
- Unknown `sub_domain_id` -> **404**
- Optional `domain_id` mismatch with selected `sub_domain_id` -> **422**

---

## SQL Onboarding Contract

### Endpoint

- **POST** `/api/onboard/sql`

### Request Body (extended)

```json
{
  "connection_string": "DRIVER={ODBC Driver 18 for SQL Server};SERVER=...;DATABASE=...;UID=...;PWD=...;Encrypt=yes;",
  "schema_name": "dbo",
  "table_name": "CUST",
  "delta_only": true,
  "sub_domain_id": "subdomain-123",
  "domain_id": "domain-abc"
}
```

### Link Created

- `(sd:SubDomain)-[:USES_SQLSERVER]->(db:Database)`

### Cypher (reference)

```cypher
MATCH (sd:SubDomain {id: $sub_domain_id})
MATCH (db:Database {name: $database_name})
MERGE (sd)-[r:USES_SQLSERVER]->(db)
ON CREATE SET r.created_at = datetime(), r.created_by = coalesce($requested_by, 'sql_onboarding')
ON MATCH SET r.last_seen_at = datetime()
RETURN sd.id AS sub_domain_id, db.name AS asset_name
```

### Response Extension

```json
{
  "sub_domain_link": {
    "sub_domain_id": "subdomain-123",
    "asset_type": "Database",
    "asset_name": "iwmsproddb",
    "relationship_type": "USES_SQLSERVER",
    "created": true
  }
}
```

---

## Cosmos Onboarding Contract

### Endpoint

- **POST** `/api/onboard/cosmos`

### Request Body (extended)

```json
{
  "uri": "https://myaccount.documents.azure.com:443/",
  "key": "<secret>",
  "database_name": "inventorydb",
  "sub_domain_id": "subdomain-123",
  "domain_id": "domain-abc"
}
```

### Link Created

- `(sd:SubDomain)-[:USES_COSMOSDB]->(cdb:CosmosDatabase)`

### Cypher (reference)

```cypher
MATCH (sd:SubDomain {id: $sub_domain_id})
MATCH (cdb:CosmosDatabase {name: $database_name})
MERGE (sd)-[r:USES_COSMOSDB]->(cdb)
ON CREATE SET r.created_at = datetime(), r.created_by = coalesce($requested_by, 'cosmos_onboarding')
ON MATCH SET r.last_seen_at = datetime()
RETURN sd.id AS sub_domain_id, cdb.name AS asset_name
```

### Response Extension

```json
{
  "sub_domain_link": {
    "sub_domain_id": "subdomain-123",
    "asset_type": "CosmosDatabase",
    "asset_name": "inventorydb",
    "relationship_type": "USES_COSMOSDB",
    "created": true
  }
}
```

---

## Kafka Onboarding Contract

### Endpoint

- **POST** `/api/onboard/kafka`

### Request Body (extended)

```json
{
  "bootstrap_servers": "kafka01:9092,kafka02:9092",
  "sub_domain_id": "subdomain-123",
  "domain_id": "domain-abc"
}
```

### Link Created

Primary (required):
- `(sd:SubDomain)-[:USES_KAFKA]->(t:Topic)` for each onboarded topic

Optional (if model supports stable cluster node):
- `(sd:SubDomain)-[:USES_KAFKA]->(k:KafkaCluster)`

### Cypher (topic-level reference)

```cypher
MATCH (sd:SubDomain {id: $sub_domain_id})
UNWIND $topic_names AS topic_name
MATCH (t:Topic {name: topic_name})
MERGE (sd)-[r:USES_KAFKA]->(t)
ON CREATE SET r.created_at = datetime(), r.created_by = coalesce($requested_by, 'kafka_onboarding')
ON MATCH SET r.last_seen_at = datetime()
RETURN count(t) AS linked_topics
```

### Response Extension

```json
{
  "sub_domain_link": {
    "sub_domain_id": "subdomain-123",
    "asset_type": "Topic",
    "relationship_type": "USES_KAFKA",
    "linked_count": 37
  }
}
```

---

## Error Handling and Transactions

- Preserve existing onboarding errors for source connection/data issues.
- Do not return false success if link creation fails.

Preferred behavior:
- Run onboarding and sub-domain linking in one logical transaction/unit.

If split operations are required:
- Return explicit partial status indicating onboarding success and link failure reason.

---

## Idempotency Requirements

Repeated requests with same `sub_domain_id` and same onboarded assets must not create duplicate edges.

Use `MERGE` for:
- `USES_SQLSERVER`
- `USES_COSMOSDB`
- `USES_KAFKA`
- Optional `USES_KAFKA` (cluster-level variant, same relationship type)

---

## Frontend Expectations (Already Implemented)

Frontend now sends `sub_domain_id` and optional `domain_id` for:
- `/api/onboard/sql`
- `/api/onboard/cosmos`
- `/api/onboard/kafka`

Existing source-specific fields are unchanged.

---

## Unified Acceptance Checklist

- [ ] All three onboarding endpoints accept `sub_domain_id` (+ optional `domain_id`)
- [ ] SQL creates/merges `USES_SQLSERVER` to `Database`
- [ ] Cosmos creates/merges `USES_COSMOSDB` to `CosmosDatabase`
- [ ] Kafka creates/merges `USES_KAFKA` to onboarded `Topic` nodes
- [ ] No duplicate relationships on retries
- [ ] Clear 4xx validation for missing/invalid hierarchy context
- [ ] Responses include `sub_domain_link` summary object

---

## Unified Quick Tests

1. SQL valid request + valid sub-domain
- Expect 200 and `sub_domain_link.relationship_type = USES_SQLSERVER`

2. Cosmos valid request + valid sub-domain
- Expect 200 and `sub_domain_link.relationship_type = USES_COSMOSDB`

3. Kafka valid request + valid sub-domain
- Expect 200 and `sub_domain_link.relationship_type = USES_KAFKA`

4. Repeat same requests
- Expect 200 with no duplicate links

5. Missing `sub_domain_id`
- Expect 422

6. Unknown `sub_domain_id`
- Expect 404
