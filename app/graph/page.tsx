"use client";

import { useCallback, useEffect, useState } from "react";
import GraphViewer from "@/components/graph/GraphViewer";
import { APIRequestError } from "@/services/api";
import { getGraph, queryGraph } from "@/services/graphService";
import type { CypherQueryResponse, GraphVisualization } from "@/types/api";

const defaultQuery =
	"MATCH (d:Database)-[r:HAS_SCHEMA|HAS_TABLE|HAS_COLUMN]->(n) RETURN d, r, n LIMIT 10";

export default function GraphPage() {
	const [limit, setLimit] = useState(500);
	const [graph, setGraph] = useState<GraphVisualization | null>(null);
	const [query, setQuery] = useState(defaultQuery);
	const [queryResult, setQueryResult] = useState<CypherQueryResponse | null>(null);
	const [isLoadingGraph, setIsLoadingGraph] = useState(false);
	const [isRunningQuery, setIsRunningQuery] = useState(false);
	const [error, setError] = useState("");

	const loadGraph = useCallback(async () => {
		setIsLoadingGraph(true);
		setError("");
		try {
			const data = await getGraph(limit);
			setGraph(data);
		} catch (err) {
			if (err instanceof APIRequestError) {
				setError(
					typeof err.detail === "string"
						? err.detail
						: JSON.stringify(err.detail, null, 2),
				);
			} else {
				setError("Failed to load graph.");
			}
		} finally {
			setIsLoadingGraph(false);
		}
	}, [limit]);

	useEffect(() => {
		void loadGraph();
	}, [loadGraph]);

	const runCypher = async () => {
		setIsRunningQuery(true);
		setError("");
		try {
			const result = await queryGraph({ query, parameters: {} });
			setQueryResult(result);
		} catch (err) {
			if (err instanceof APIRequestError) {
				setError(
					typeof err.detail === "string"
						? err.detail
						: JSON.stringify(err.detail, null, 2),
				);
			} else {
				setError("Cypher query failed.");
			}
		} finally {
			setIsRunningQuery(false);
		}
	};

	return (
		<div className="space-y-5">
			<section className="surface p-6">
				<h2 className="font-display text-3xl text-blue-950">Graph Explorer</h2>
				<p className="mt-1 text-sm text-blue-900/75">
					Fetch graph visualization data and run custom Cypher for deep traversal.
				</p>

				<div className="mt-4 flex flex-wrap items-center gap-3">
					<input
						className="input-field w-36"
						max={10000}
						min={1}
						onChange={(event) => setLimit(Number(event.target.value) || 500)}
						type="number"
						value={limit}
					/>
					<button
						className="btn-primary"
						disabled={isLoadingGraph}
						onClick={loadGraph}
						type="button"
					>
						{isLoadingGraph ? "Loading..." : "Reload Graph"}
					</button>
				</div>

				{error ? (
					<pre className="alert-error mt-4 overflow-auto text-xs">
						{error}
					</pre>
				) : null}
			</section>

			<GraphViewer data={graph} />

			<section className="surface p-5">
				<h3 className="text-lg font-semibold text-blue-950">Cypher Query Runner</h3>
				<textarea
					className="mono textarea-field mt-3 min-h-28"
					onChange={(event) => setQuery(event.target.value)}
					value={query}
				/>
				<button
					className="btn-primary mt-3"
					disabled={isRunningQuery || !query.trim()}
					onClick={runCypher}
					type="button"
				>
					{isRunningQuery ? "Running..." : "Run Query"}
				</button>

				<pre className="mono code-panel mt-3 max-h-96 overflow-auto text-xs">
					{queryResult ? JSON.stringify(queryResult, null, 2) : "Run a query to inspect result rows."}
				</pre>
			</section>
		</div>
	);
}