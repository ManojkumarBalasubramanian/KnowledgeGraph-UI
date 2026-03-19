# Cosmos + Kafka Onboarding + Sub Domain Linking — Backend Handoff

> Superseded by `SQL_ONBOARDING_SUBDOMAIN_BACKEND_HANDOFF.md` (unified SQL + Cosmos + Kafka contract). Keep this file for historical context only.

**Status:** Frontend-ready contract requested
**Routes:** `http://localhost:3000/onboard/cosmos`, `http://localhost:3000/onboard/kafka`
**Last Updated:** 2026-03-18

---

## Goal

Mirror the SQL hierarchy-aware onboarding pattern for Cosmos and Kafka:

1. Frontend selects `Domain -> Sub Domain` before onboarding.
2. Backend runs existing onboarding logic.
3. Backend links selected `SubDomain` to onboarded assets using semantic relationships.

---

## Shared Hierarchy Source

Use existing endpoint (already used elsewhere):

- **GET** `/api/graph/metadata-explorer/hierarchy`

Expected fields used by UI:
- `domains[].id`, `domains[].name`
- `domains[].sub_domains[].id`, `domains[].sub_domains[].name`

No backend change is required if this response shape is already stable.

---

## 1) Cosmos Onboarding Contract Update

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

Field notes:
- `sub_domain_id` is required for this flow.
- `domain_id` is optional but recommended for hierarchy consistency checks.

### Graph Link Requirement

After onboarding/upserting Cosmos DB graph nodes, link selected Sub Domain to Cosmos database node:

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

### Response Body (extended)

```json
{
  "message": "Cosmos onboarding completed and linked to Sub Domain.",
  "containers_onboarded": 24,
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

## 2) Kafka Onboarding Contract Update

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

Field notes:
- `sub_domain_id` is required for this flow.
- `domain_id` is optional.

### Graph Link Requirement

Kafka onboarding commonly creates/upserts multiple topics. Backend should link selected Sub Domain to each onboarded topic:

- `(sd:SubDomain)-[:USES_KAFKA]->(t:Topic)`

If your model has a stable cluster/broker node, you may additionally link:
- `(sd)-[:USES_KAFKA]->(k:KafkaCluster)`

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

### Response Body (extended)

```json
{
  "message": "Kafka onboarding completed and linked to Sub Domain.",
  "topics_onboarded": 37,
  "sub_domain_link": {
    "sub_domain_id": "subdomain-123",
    "asset_type": "Topic",
    "relationship_type": "USES_KAFKA",
    "linked_count": 37
  }
}
```

---

## Validation and Errors (Both Endpoints)

- Missing `sub_domain_id`: **422**
- Unknown `sub_domain_id`: **404**
- Onboarding failure: return normal onboarding error (no false success)
- Optional: validate `domain_id` owns the submitted sub-domain; reject mismatch with **422**

---

## Idempotency Requirements

Repeated requests for same `sub_domain_id` and same onboarded assets must not create duplicate edges.

Use `MERGE` for:
- `USES_COSMOSDB`
- `USES_KAFKA`

---

## Acceptance Checklist

- [ ] `/api/onboard/cosmos` accepts `sub_domain_id` (+ optional `domain_id`)
- [ ] `/api/onboard/kafka` accepts `sub_domain_id` (+ optional `domain_id`)
- [ ] Cosmos onboarding creates/merges `USES_COSMOSDB` from selected Sub Domain
- [ ] Kafka onboarding creates/merges `USES_KAFKA` from selected Sub Domain to onboarded topics
- [ ] No duplicate links on retries
- [ ] 4xx validation errors are returned for missing/invalid hierarchy IDs
- [ ] Responses include a `sub_domain_link` summary payload

---

## Quick Test Cases

1. Cosmos onboarding with valid sub-domain
- Expect 200 and `sub_domain_link.relationship_type = USES_COSMOSDB`

2. Kafka onboarding with valid sub-domain
- Expect 200 and `sub_domain_link.relationship_type = USES_KAFKA`

3. Repeat the same Cosmos/Kafka requests
- Expect 200 with no duplicate relationships

4. Missing `sub_domain_id`
- Expect 422

5. Invalid `sub_domain_id`
- Expect 404
