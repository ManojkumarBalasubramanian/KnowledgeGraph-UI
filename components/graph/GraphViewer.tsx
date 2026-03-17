import type { GraphVisualization } from "@/types/api";

const labelColors: Record<string, string> = {
	PepsiCo: "bg-blue-200 text-blue-950",
	Department: "bg-blue-100 text-blue-900",
	SubDepartment: "bg-sky-100 text-sky-900",
	Database: "bg-blue-100 text-blue-900",
	Schema: "bg-sky-100 text-sky-900",
	Table: "bg-indigo-100 text-indigo-900",
	Column: "bg-cyan-100 text-cyan-900",
	Container: "bg-blue-50 text-blue-800",
	Topic: "bg-red-100 text-red-900",
};

const labelHierarchyRank: Record<string, number> = {
	PepsiCo: 0,
	Department: 1,
	SubDepartment: 2,
	Database: 3,
	Schema: 4,
	Table: 5,
	Column: 6,
	Container: 4,
	Topic: 4,
};

interface GraphViewerProps {
	data: GraphVisualization | null;
}

const MAX_RENDER_ITEMS = 300;

const getNodeName = (node: GraphVisualization["nodes"][number]): string => {
	const named = node.properties?.name;
	if (typeof named === "string" && named.trim()) {
		return named;
	}

	const parts = node.id.split(":");
	return parts[parts.length - 1] || node.id;
};

const compareNodes = (
	a: GraphVisualization["nodes"][number],
	b: GraphVisualization["nodes"][number],
): number => {
	const rankA = labelHierarchyRank[a.label] ?? 99;
	const rankB = labelHierarchyRank[b.label] ?? 99;

	if (rankA !== rankB) {
		return rankA - rankB;
	}

	return getNodeName(a).localeCompare(getNodeName(b));
};

export default function GraphViewer({ data }: GraphViewerProps) {
	if (!data) {
		return (
			<div className="rounded-2xl border border-dashed border-blue-200 bg-white p-8 text-center text-blue-800/65">
				Graph data will appear here after loading.
			</div>
		);
	}

	const visibleNodes = data.nodes.slice(0, MAX_RENDER_ITEMS);
	const visibleEdges = data.edges.slice(0, MAX_RENDER_ITEMS);
	const hasHiddenNodes = data.nodes.length > visibleNodes.length;
	const hasHiddenEdges = data.edges.length > visibleEdges.length;

	const nodeById = new Map(visibleNodes.map((node) => [node.id, node]));
	const childrenByParent = new Map<string, Set<string>>();
	const indegreeById = new Map<string, number>(visibleNodes.map((node) => [node.id, 0]));

	visibleEdges.forEach((edge) => {
		if (!nodeById.has(edge.source) || !nodeById.has(edge.target)) {
			return;
		}

		if (!childrenByParent.has(edge.source)) {
			childrenByParent.set(edge.source, new Set());
		}

		childrenByParent.get(edge.source)?.add(edge.target);
		indegreeById.set(edge.target, (indegreeById.get(edge.target) || 0) + 1);
	});

	const rootNodes = visibleNodes
		.filter((node) => (indegreeById.get(node.id) || 0) === 0)
		.sort(compareNodes);

	const fallbackRoots = [...visibleNodes].sort(compareNodes);
	const displayRoots = rootNodes.length > 0 ? rootNodes : fallbackRoots;

	const renderNodeTree = (
		nodeId: string,
		depth: number,
		path: Set<string>,
		lineage: string[],
	): JSX.Element | null => {
		const node = nodeById.get(nodeId);
		if (!node || path.has(nodeId) || depth > 12) {
			return null;
		}

		const nextPath = new Set(path);
		nextPath.add(nodeId);
		const currentName = getNodeName(node);
		const currentLineage = [...lineage, currentName];

		const childIds = Array.from(childrenByParent.get(nodeId) || [])
			.map((id) => nodeById.get(id))
			.filter((item): item is NonNullable<typeof item> => Boolean(item))
			.sort(compareNodes)
			.map((item) => item.id);

		return (
			<li key={`${nodeId}-${depth}`} className="space-y-1">
				<div className="rounded-lg border border-blue-100 bg-blue-50/40 p-2">
					<p className="mb-1 truncate text-[10px] uppercase tracking-wide text-blue-900/65">
						{currentLineage.join(" > ")}
					</p>
					<div className="flex items-center gap-2">
						<span
							className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${labelColors[node.label] || "bg-blue-100 text-blue-800"}`}
						>
							{node.label}
						</span>
						<p className="truncate text-xs font-semibold text-blue-950">{currentName}</p>
					</div>
				</div>
				{childIds.length > 0 ? (
					<ul className="ml-4 space-y-1 border-l border-blue-200 pl-3">
						{childIds.map((childId) =>
							renderNodeTree(childId, depth + 1, nextPath, currentLineage),
						)}
					</ul>
				) : null}
			</li>
		);
	};

	return (
		<section className="grid gap-4 lg:grid-cols-2">
			<article className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
				<h3 className="font-display text-lg text-blue-950">Hierarchy</h3>
				<p className="mb-3 text-sm text-blue-900/65">{data.nodes.length} total</p>
				{hasHiddenNodes ? (
					<p className="mb-3 text-xs text-amber-700">
						Showing first {visibleNodes.length} nodes for performance.
					</p>
				) : null}
				<div className="max-h-[460px] overflow-auto pr-1">
					<ul className="space-y-2">
						{displayRoots.map((root) => renderNodeTree(root.id, 0, new Set(), []))}
					</ul>
				</div>
			</article>

			<article className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
				<h3 className="font-display text-lg text-blue-950">Relationships</h3>
				<p className="mb-3 text-sm text-blue-900/65">{data.edges.length} total</p>
				{hasHiddenEdges ? (
					<p className="mb-3 text-xs text-amber-700">
						Showing first {visibleEdges.length} relationships for performance.
					</p>
				) : null}
				<div className="max-h-[460px] space-y-2 overflow-auto pr-1">
					{visibleEdges.map((edge, index) => (
						<div
							key={`${edge.source}-${edge.target}-${index}`}
							className="rounded-xl border border-blue-100 bg-blue-50/30 p-3"
						>
							<p className="text-sm font-semibold text-blue-900">{edge.type}</p>
							<p className="text-xs text-blue-900/75">from: {edge.source}</p>
							<p className="text-xs text-blue-900/75">to: {edge.target}</p>
						</div>
					))}
				</div>
			</article>
		</section>
	);
}