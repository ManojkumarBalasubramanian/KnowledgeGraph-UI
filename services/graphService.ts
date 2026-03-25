import { api } from "./api";
import type {
	CypherQueryRequest,
	CypherQueryResponse,
	CreateDomainRequest,
	CreateDomainResponse,
	CreateSubDomainRequest,
	CreateSubDomainResponse,
	GraphEdge,
	GraphNode,
	GraphSchema,
	GraphStats,
	GraphVisualization,
	MetadataAssetType,
	MetadataBulkUpdateColumnDescriptionsRequest,
	MetadataExplorerAsset,
	MetadataExplorerDomain,
	MetadataExplorerEnterprise,
	MetadataExplorerSchema,
	MetadataExplorerStore,
	MetadataExplorerSubDomain,
	MessageResponse,
	MetadataAssetDetailResponse,
	MetadataExplorerHierarchyResponse,
	MetadataStoreType,
	MetadataProcessApprovedDescriptionsRequest,
	NodeSearchRequest,
	NodeSearchResponse,
} from "@/types/api";

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const toNodeId = (node: Record<string, unknown>, fallback: string): string => {
	const candidate = node.name ?? node.id ?? node.key;
	return typeof candidate === "string" && candidate.trim() ? candidate : fallback;
};

const readString = (
	obj: Record<string, unknown>,
	keys: string[],
	fallback = "",
): string => {
	for (const key of keys) {
		const value = obj[key];
		if (typeof value === "string" && value.trim()) {
			return value;
		}
	}
	return fallback;
};

const readArray = (obj: Record<string, unknown>, keys: string[]): unknown[] => {
	for (const key of keys) {
		const value = obj[key];
		if (Array.isArray(value)) {
			return value;
		}
		if (isRecord(value)) {
			return Object.values(value);
		}
	}
	return [];
};

const extractHierarchyRoot = (
	payload: unknown,
	depth = 0,
): Record<string, unknown> | null => {
	if (!isRecord(payload) || depth > 4) {
		return null;
	}

	if (
		Array.isArray(payload.domains) ||
		Array.isArray(payload.enterprises) ||
		isRecord(payload.domains) ||
		isRecord(payload.enterprises)
	) {
		return payload;
	}

	const candidateKeys = [
		"data",
		"result",
		"payload",
		"response",
		"hierarchy",
		"metadata_hierarchy",
		"metadataExplorerHierarchy",
	];

	for (const key of candidateKeys) {
		const nested = payload[key];
		const extracted = extractHierarchyRoot(nested, depth + 1);
		if (extracted) {
			return extracted;
		}
	}

	return null;
};

const normalizeAsset = (asset: unknown, index: number): MetadataExplorerAsset | null => {
	if (!isRecord(asset)) {
		return null;
	}

	const id = readString(asset, ["id", "asset_id", "table_id", "collection_id"], `asset-${index}`);
	const name = readString(asset, ["name", "asset_name", "table_name", "collection_name"], id);
	const assetTypeRaw = readString(asset, ["asset_type", "type"], "Table");
	const asset_type: MetadataAssetType = assetTypeRaw === "Collection" ? "Collection" : "Table";

	return { id, name, asset_type };
};

const normalizeSchema = (schema: unknown, index: number): MetadataExplorerSchema | null => {
	if (!isRecord(schema)) {
		return null;
	}

	const id = readString(schema, ["id", "schema_id"], `schema-${index}`);
	const name = readString(schema, ["name", "schema_name"], id);
	const assetsRaw = readArray(schema, ["assets", "tables", "collections"]);
	const assets = assetsRaw
		.map((asset, assetIndex) => normalizeAsset(asset, assetIndex))
		.filter((item): item is NonNullable<typeof item> => Boolean(item));

	return { id, name, assets };
};

const normalizeStore = (store: unknown, index: number): MetadataExplorerStore | null => {
	if (!isRecord(store)) {
		return null;
	}

	const id = readString(store, ["id", "store_id", "database_id"], `store-${index}`);
	const name = readString(store, ["name", "store_name", "database_name"], id);
	const storeTypeRaw = readString(store, ["store_type", "type"], "Database");
	const store_type: MetadataStoreType =
		storeTypeRaw === "CosmosDatabase" ? "CosmosDatabase" : "Database";
	const schemasRaw = readArray(store, ["schemas"]);
	const schemas = schemasRaw
		.map((schema, schemaIndex) => normalizeSchema(schema, schemaIndex))
		.filter((item): item is NonNullable<typeof item> => Boolean(item));

	return { id, name, store_type, schemas };
};

const normalizeSubDomain = (
	subDomain: unknown,
	index: number,
): MetadataExplorerSubDomain | null => {
	if (!isRecord(subDomain)) {
		return null;
	}

	const id = readString(
		subDomain,
		["id", "sub_domain_id", "subdomain_id"],
		`subdomain-${index}`,
	);
	const name = readString(
		subDomain,
		["name", "sub_domain_name", "subdomain_name"],
		id,
	);
	const storesRaw = readArray(subDomain, ["stores", "databases"]);
	const stores = storesRaw
		.map((store, storeIndex) => normalizeStore(store, storeIndex))
		.filter((item): item is NonNullable<typeof item> => Boolean(item));

	return { id, name, stores };
};

const normalizeDomain = (domain: unknown, index: number): MetadataExplorerDomain | null => {
	if (!isRecord(domain)) {
		return null;
	}

	const id = readString(domain, ["id", "domain_id"], `domain-${index}`);
	const name = readString(domain, ["name", "domain_name"], id);
	const subDomainsRaw = readArray(domain, ["sub_domains", "subdomains", "children"]);
	const sub_domains = subDomainsRaw
		.map((subDomain, subDomainIndex) => normalizeSubDomain(subDomain, subDomainIndex))
		.filter((item): item is NonNullable<typeof item> => Boolean(item));

	return { id, name, sub_domains };
};

const normalizeEnterprise = (enterprise: unknown, index: number): MetadataExplorerEnterprise | null => {
	if (!isRecord(enterprise)) {
		return null;
	}

	const id = readString(enterprise, ["id", "enterprise_id"], `enterprise-${index}`);
	const name = readString(enterprise, ["name", "enterprise_name"], id);
	const domainsRaw = readArray(enterprise, ["domains"]);
	const domains = domainsRaw
		.map((domain, domainIndex) => normalizeDomain(domain, domainIndex))
		.filter((item): item is MetadataExplorerDomain => Boolean(item));

	return { id, name, domains };
};

const normalizeHierarchyResponse = (payload: unknown): MetadataExplorerHierarchyResponse => {
	const root = extractHierarchyRoot(payload);
	if (!root) {
		return { domains: [] };
	}

	const enterprises = readArray(root, ["enterprises"])
		.map((enterprise, index) => normalizeEnterprise(enterprise, index))
		.filter((item): item is MetadataExplorerEnterprise => Boolean(item));

	let domains: MetadataExplorerDomain[] = readArray(root, ["domains"])
		.map((domain, index) => normalizeDomain(domain, index))
		.filter((item): item is MetadataExplorerDomain => Boolean(item));

	if (domains.length === 0 && enterprises.length > 0) {
		domains = enterprises.flatMap((enterprise) => enterprise.domains || []);
	}

	return {
		domains,
		...(enterprises.length > 0 ? { enterprises } : {}),
	};
};

const normalizeGraphResponse = (payload: unknown): GraphVisualization => {
	if (isRecord(payload) && Array.isArray(payload.nodes) && Array.isArray(payload.edges)) {
		return {
			nodes: payload.nodes as GraphNode[],
			edges: payload.edges as GraphEdge[],
		};
	}

	if (!Array.isArray(payload)) {
		return { nodes: [], edges: [] };
	}

	const nodesById = new Map<string, GraphNode>();
	const edges: GraphEdge[] = [];

	payload.forEach((row, index) => {
		if (!isRecord(row)) {
			return;
		}

		const sourceRaw = isRecord(row.n) ? row.n : null;
		const targetRaw = isRecord(row.m) ? row.m : null;
		const relationRaw = Array.isArray(row.r) ? row.r : null;

		if (!sourceRaw || !targetRaw) {
			return;
		}

		const sourceId = toNodeId(sourceRaw, `source-${index}`);
		const targetId = toNodeId(targetRaw, `target-${index}`);

		if (!nodesById.has(sourceId)) {
			nodesById.set(sourceId, {
				id: sourceId,
				label: "Unknown",
				properties: sourceRaw,
			});
		}

		if (!nodesById.has(targetId)) {
			nodesById.set(targetId, {
				id: targetId,
				label: "Unknown",
				properties: targetRaw,
			});
		}

		let relationType = "RELATED_TO";
		if (relationRaw && typeof relationRaw[1] === "string" && relationRaw[1].trim()) {
			relationType = relationRaw[1];
		}

		edges.push({
			source: sourceId,
			target: targetId,
			type: relationType,
			properties: {},
		});
	});

	return {
		nodes: Array.from(nodesById.values()),
		edges,
	};
};

export const getGraph = async (limit = 500): Promise<GraphVisualization> => {
	const payload = await api.get<unknown>(`/api/graph?limit=${limit}`);
	return normalizeGraphResponse(payload);
};

export const queryGraph = async (
	payload: CypherQueryRequest,
): Promise<CypherQueryResponse> =>
	api.post<CypherQueryResponse>("/api/graph/query", payload);

export const searchGraphNodes = async (
	payload: NodeSearchRequest,
): Promise<NodeSearchResponse> =>
	api.post<NodeSearchResponse>("/api/graph/nodes/search", payload);

export const getGraphStats = async (): Promise<GraphStats> =>
	api.get<GraphStats>("/api/graph/stats");

export const getGraphSchema = async (): Promise<GraphSchema> =>
	api.get<GraphSchema>("/api/graph/schema");

export const getMetadataExplorerHierarchy = async (): Promise<MetadataExplorerHierarchyResponse> =>
	api
		.get<unknown>("/api/graph/metadata-explorer/hierarchy")
		.then((payload) => normalizeHierarchyResponse(payload));

export const getMetadataAssetDetail = async (
	assetId: string,
): Promise<MetadataAssetDetailResponse> =>
	api.get<MetadataAssetDetailResponse>(
		`/api/graph/metadata-explorer/assets/${encodeURIComponent(assetId)}`,
	);

export const bulkUpdateMetadataColumnDescriptions = async (
	assetId: string,
	payload: MetadataBulkUpdateColumnDescriptionsRequest,
): Promise<MessageResponse> =>
	api.post<MessageResponse>(
		`/api/graph/metadata-explorer/assets/${encodeURIComponent(assetId)}/columns/business-description/bulk`,
		payload,
	);

export const processMetadataApprovedDescriptions = async (
	assetId: string,
	payload: MetadataProcessApprovedDescriptionsRequest,
): Promise<MessageResponse> =>
	api.post<MessageResponse>(
		`/api/graph/metadata-explorer/assets/${encodeURIComponent(assetId)}/process-approved`,
		payload,
	);

export const createDomain = async (
	payload: CreateDomainRequest,
): Promise<CreateDomainResponse> =>
	api.post<CreateDomainResponse>("/api/hierarchy/domain", payload);

export const createSubDomain = async (
	payload: CreateSubDomainRequest,
): Promise<CreateSubDomainResponse> =>
	api.post<CreateSubDomainResponse>("/api/hierarchy/subdomain", payload);