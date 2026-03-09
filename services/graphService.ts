import { api } from "./api";
import type {
	CypherQueryRequest,
	CypherQueryResponse,
	GraphEdge,
	GraphNode,
	GraphSchema,
	GraphStats,
	GraphVisualization,
	NodeSearchRequest,
	NodeSearchResponse,
} from "@/types/api";

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const toNodeId = (node: Record<string, unknown>, fallback: string): string => {
	const candidate = node.name ?? node.id ?? node.key;
	return typeof candidate === "string" && candidate.trim() ? candidate : fallback;
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