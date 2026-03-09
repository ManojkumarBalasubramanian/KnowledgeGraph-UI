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

export interface SQLOnboardRequest {
  connection_string: string;
}

export interface SQLOnboardResponse {
  message: string;
  result?: {
    database: string;
    csv_export: string;
    ontology_count: number;
  };
}

export interface CosmosOnboardRequest {
  uri: string;
  key: string;
  database_name: string;
}

export interface CosmosOnboardResponse {
  message: string;
  containers_onboarded: number;
}

export interface KafkaOnboardRequest {
  bootstrap_servers: string;
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