"use client";

import { useEffect, useState } from "react";
import { getGraphSchema, getGraphStats } from "@/services/graphService";
import { getHealth, getLiveHealth, getMetrics, getReadyHealth } from "@/services/systemService";
import type { GraphSchema, GraphStats, HealthStatus } from "@/types/api";

export default function Dashboard() {
	const [health, setHealth] = useState<HealthStatus | null>(null);
	const [live, setLive] = useState<HealthStatus | null>(null);
	const [ready, setReady] = useState<HealthStatus | null>(null);
	const [stats, setStats] = useState<GraphStats | null>(null);
	const [schema, setSchema] = useState<GraphSchema | null>(null);
	const [metricsPreview, setMetricsPreview] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		Promise.all([
			getHealth(),
			getLiveHealth(),
			getReadyHealth(),
			getGraphStats(),
			getGraphSchema(),
			getMetrics(),
		])
			.then(([healthData, liveData, readyData, statsData, schemaData, metrics]) => {
				setHealth(healthData);
				setLive(liveData);
				setReady(readyData);
				setStats(statsData);
				setSchema(schemaData);
				setMetricsPreview(metrics.split("\n").slice(0, 24).join("\n"));
			})
			.catch((err: unknown) => {
				setError(err instanceof Error ? err.message : "Failed loading dashboard data.");
			});
	}, []);

	return (
		<div className="space-y-5">
			<section className="surface p-6">
				<h2 className="font-display text-3xl text-blue-950">System Dashboard</h2>
				<p className="mt-1 text-sm text-blue-900/75">
					Health probes, graph telemetry, and schema metadata from the backend.
				</p>
			</section>

			{error ? (
				<section className="alert-error text-sm">
					{error}
				</section>
			) : null}

			<section className="grid gap-4 md:grid-cols-3">
				{[health, live, ready].map((item, index) => (
					<article key={index} className="surface p-4">
						<p className="text-xs uppercase tracking-[0.18em] text-blue-700/65">
							{index === 0 ? "Health" : index === 1 ? "Liveness" : "Readiness"}
						</p>
						<p className="mt-2 text-2xl font-semibold text-blue-950">
							{item?.status || "loading"}
						</p>
						{item?.neo4j ? <p className="mt-1 text-sm text-blue-900/70">Neo4j: {item.neo4j}</p> : null}
					</article>
				))}
			</section>

			<section className="grid gap-4 xl:grid-cols-2">
				<article className="surface p-4">
					<h3 className="text-lg font-semibold text-blue-950">Graph Stats</h3>
					<pre className="mono code-panel mt-3 overflow-auto text-xs">
						{JSON.stringify(stats, null, 2)}
					</pre>
				</article>

				<article className="surface p-4">
					<h3 className="text-lg font-semibold text-blue-950">Graph Schema</h3>
					<pre className="mono code-panel mt-3 overflow-auto text-xs">
						{JSON.stringify(schema, null, 2)}
					</pre>
				</article>
			</section>

			<section className="surface p-4">
				<h3 className="text-lg font-semibold text-blue-950">Metrics Preview</h3>
				<pre className="mono code-panel mt-3 max-h-80 overflow-auto text-xs">
					{metricsPreview || "Loading metrics..."}
				</pre>
			</section>
		</div>
	);
}