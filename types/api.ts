export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface HealthStatus {
  status: "UP" | "DOWN" | "alive" | "ready" | "not ready";
  neo4j?: "connected" | "disconnected";
}

export interface LLMRequest {
  prompt: string;
  max_tokens?: number;
}

export interface LLMTokens {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface LLMSafety {
  hate: boolean;
  self_harm: boolean;
  sexual: boolean;
  violence: boolean;
}

export interface LLMResponse {
  id: string | null;
  model: string | null;
  response: string;
  finish_reason: "stop" | "length" | "content_filter" | null;
  tokens: LLMTokens | null;
  safety?: LLMSafety;
  error: string | null;
}

export interface LLMAnswerResponse {
  answer: string;
}

export interface NodeProperties {
  name?: string;
  type?: string;
  schema?: string;
  database?: string;
  data_type?: string;
  is_nullable?: boolean;
  row_count?: number;
  created_at?: string;
  [key: string]: unknown;
}

export interface GraphNode {
  id: string;
  label: string;
  properties: NodeProperties;
}

export interface EdgeProperties {
  column_name?: string;
  [key: string]: unknown;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  properties: EdgeProperties;
}

export interface GraphVisualization {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface CypherQueryRequest {
  query: string;
  parameters?: Record<string, unknown>;
}

export interface CypherQueryResponse {
  results: Record<string, unknown>[];
  count: number;
}

export interface NodeSearchRequest {
  label: string;
  property_name?: string;
  property_value?: string;
}

export interface NodeSearchResponse {
  nodes: GraphNode[];
  count: number;
}

export interface LabelCount {
  label: string;
  count: number;
}

export interface RelationshipCount {
  relationship_type: string;
  count: number;
}

export interface GraphStats {
  total_nodes: number;
  total_relationships: number;
  node_counts_by_label: LabelCount[];
  relationship_counts_by_type: RelationshipCount[];
}

export interface GraphSchema {
  node_labels: string[];
  relationship_types: string[];
}

export type MetadataStoreType = "Database" | "CosmosDatabase";

export type MetadataAssetType = "Table" | "Collection";

export interface MetadataExplorerAsset {
  id: string;
  name: string;
  asset_type: MetadataAssetType;
}

export interface MetadataExplorerSchema {
  id: string;
  name: string;
  assets: MetadataExplorerAsset[];
}

export interface MetadataExplorerStore {
  id: string;
  name: string;
  store_type: MetadataStoreType;
  schemas: MetadataExplorerSchema[];
}

export interface MetadataExplorerSubDomain {
  id: string;
  name: string;
  stores: MetadataExplorerStore[];
}

export interface MetadataExplorerDomain {
  id: string;
  name: string;
  sub_domains: MetadataExplorerSubDomain[];
}

export interface MetadataExplorerHierarchyResponse {
  domains: MetadataExplorerDomain[];
}

export interface MetadataApprovedDescription {
  description: string;
  approved_by: string | null;
  approved_at: string | null;
  confidence: number | null;
}

export interface MetadataColumnDetail {
  column_id: string;
  name: string;
  data_type: string | null;
  business_description: string | null;
  llm_confidence: number | null;
  approved_descriptions: MetadataApprovedDescription[];
}

export interface MetadataAssetDetailResponse {
  asset_id: string;
  name: string;
  data_type: string | null;
  business_description: string | null;
  llm_confidence: number | null;
  approved_descriptions: MetadataApprovedDescription[];
  columns: MetadataColumnDetail[];
}

export interface MetadataColumnDescriptionBulkItem {
  column_id: string;
  business_description: string;
  llm_confidence: number;
}

export interface MetadataBulkUpdateColumnDescriptionsRequest {
  steward?: string;
  columns: MetadataColumnDescriptionBulkItem[];
}

export interface MetadataProcessApprovedDescriptionsRequest {
  requested_by?: string;
}

export interface SQLOnboardRequest {
  connection_string?: string;
  schema_name?: string;
  table_name?: string;
  delta_only?: boolean;
  domain_id?: string;
  sub_domain_id?: string;
}

export interface SQLOnboardResponse {
  message: string;
  schema_name?: string | null;
  table_name?: string | null;
  delta_only?: boolean;
  result?: {
    database: string;
    csv_export: string;
    ontology_count: number;
  };
}

export interface SQLCatalogRequest {
  connection_string?: string;
}

export interface SQLCatalogSchema {
  schema: string;
  tables: string[];
}

export interface SQLCatalogResponse {
  schemas: SQLCatalogSchema[];
}

export interface MessageResponse {
  message: string;
}

export interface CosmosOnboardRequest {
  uri: string;
  key: string;
  database_name: string;
  domain_id?: string;
  sub_domain_id?: string;
}

export interface CosmosOnboardResponse {
  message: string;
  containers_onboarded: number;
}

export interface KafkaOnboardRequest {
  bootstrap_servers: string;
  domain_id?: string;
  sub_domain_id?: string;
}

export interface KafkaOnboardResponse {
  message: string;
  topics_onboarded: number;
}

export interface ManualRelationshipRequest {
  source_label: string;
  source_name: string;
  target_label: string;
  target_name: string;
  relation: string;
}

export interface RelationshipResponse {
  message: string;
}

export interface ForeignKeyRelationshipRequest {
  pk_table_name: string;
  pk_column_name: string;
  fk_table_name: string;
  fk_column_name: string;
  relationship_type: string;
}

export interface TableColumnInfo {
  table_name: string;
  column_name: string;
  data_type?: string;
}

export interface RelationshipHierarchyColumn {
  id: string;
  name: string;
  data_type?: string | null;
}

export interface RelationshipHierarchyTable {
  id: string;
  name: string;
  columns: RelationshipHierarchyColumn[];
}

export interface RelationshipHierarchySchema {
  id: string;
  name: string;
  tables: RelationshipHierarchyTable[];
}

export interface RelationshipHierarchyDatabase {
  id: string;
  name: string;
  schemas: RelationshipHierarchySchema[];
}

export interface RelationshipHierarchyResponse {
  databases: RelationshipHierarchyDatabase[];
}

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

export interface APIError {
  detail: string | { error: string; status_code?: number };
}

export const NODE_LABELS = [
  "Database",
  "Schema",
  "Table",
  "Column",
  "Container",
  "Topic",
] as const;

export type NodeLabel = (typeof NODE_LABELS)[number];

export const RELATIONSHIP_TYPES = [
  "HAS_SCHEMA",
  "HAS_TABLE",
  "HAS_COLUMN",
  "HAS_CONTAINER",
  "HAS_TOPIC",
  "REFERENCES",
  "DERIVED_FROM",
  "DEPENDS_ON",
  "RELATED_TO",
] as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export const FK_RELATIONSHIP_TYPES = [
  "One-to-One",
  "One-to-Many",
  "Many-to-Many",
] as const;

export type FKRelationshipType = (typeof FK_RELATIONSHIP_TYPES)[number];