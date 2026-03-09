import type { GraphVisualization } from "@/types/api";

const labelColors: Record<string, string> = {
	Database: "bg-blue-100 text-blue-900",
	Schema: "bg-sky-100 text-sky-900",
	Table: "bg-indigo-100 text-indigo-900",
	Column: "bg-cyan-100 text-cyan-900",
	Container: "bg-blue-50 text-blue-800",
	Topic: "bg-red-100 text-red-900",
};

interface GraphViewerProps {
	data: GraphVisualization | null;
}

const MAX_RENDER_ITEMS = 300;

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

	return (
		<section className="grid gap-4 lg:grid-cols-2">
			<article className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
				<h3 className="font-display text-lg text-blue-950">Nodes</h3>
				<p className="mb-3 text-sm text-blue-900/65">{data.nodes.length} total</p>
				{hasHiddenNodes ? (
					<p className="mb-3 text-xs text-amber-700">
						Showing first {visibleNodes.length} nodes for performance.
					</p>
				) : null}
				<div className="max-h-[460px] space-y-2 overflow-auto pr-1">
					{visibleNodes.map((node) => (
						<div
							key={node.id}
							className="rounded-xl border border-blue-100 bg-blue-50/40 p-3"
						>
							<div className="mb-2 flex items-center gap-2">
								<span
									className={`rounded-full px-2 py-0.5 text-xs font-semibold ${labelColors[node.label] || "bg-blue-100 text-blue-800"}`}
								>
									{node.label}
								</span>
								<p className="truncate text-sm font-semibold text-blue-950">{node.id}</p>
							</div>
							<div className="grid grid-cols-1 gap-1 text-xs text-blue-900/75">
								{Object.entries(node.properties ?? {}).slice(0, 4).map(([key, value]) => (
									<p key={key}>
										<span className="font-medium text-blue-900">{key}: </span>
										{String(value)}
									</p>
								))}
							</div>
						</div>
					))}
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