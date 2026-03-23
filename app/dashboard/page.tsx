"use client";

import { useEffect, useState } from "react";
import { getGraphSchema, getGraphStats } from "@/services/graphService";
import { getHealth, getLiveHealth, getMetrics, getReadyHealth } from "@/services/systemService";
import type { GraphSchema, GraphStats, HealthStatus } from "@/types/api";

type ParsedMetric = {
	name: string;
	value: string;
	help?: string;
	type?: string;
};

const BUSINESS_METRIC_PATTERNS = [
	/neo4j/i,
	/graph/i,
	/metadata/i,
	/onboard/i,
	/sql/i,
	/cosmos/i,
	/kafka/i,
	/llm/i,
	/http/i,
	/request/i,
	/response/i,
	/error/i,
	/latency/i,
	/duration/i,
];

const isBusinessRelevantMetric = (metricName: string) => {
	const baseMetricName = metricName.split("{")[0];
	return BUSINESS_METRIC_PATTERNS.some((pattern) => pattern.test(baseMetricName));
};

const parseMetricsPreview = (metrics: string): ParsedMetric[] => {
	const helpByMetric = new Map<string, string>();
	const typeByMetric = new Map<string, string>();
	const parsed: ParsedMetric[] = [];

	metrics.split("\n").forEach((line) => {
		const trimmed = line.trim();
		if (!trimmed) {
			return;
		}

		if (trimmed.startsWith("# HELP ")) {
			const [, metricName, ...rest] = trimmed.split(" ");
			if (metricName) {
				helpByMetric.set(metricName, rest.join(" "));
			}
			return;
		}

		if (trimmed.startsWith("# TYPE ")) {
			const [, metricName, metricType] = trimmed.split(" ");
			if (metricName && metricType) {
				typeByMetric.set(metricName, metricType);
			}
			return;
		}

		if (trimmed.startsWith("#")) {
			return;
		}

		const spaceIndex = trimmed.lastIndexOf(" ");
		if (spaceIndex === -1) {
			return;
		}

		const metricName = trimmed.slice(0, spaceIndex);
		const value = trimmed.slice(spaceIndex + 1);
		const baseMetricName = metricName.split("{")[0];

		parsed.push({
			name: metricName,
			value,
			help: helpByMetric.get(baseMetricName),
			type: typeByMetric.get(baseMetricName),
		});
	});

	const prioritized = parsed.filter((metric) => isBusinessRelevantMetric(metric.name));
	return (prioritized.length > 0 ? prioritized : parsed).slice(0, 12);
};

const formatMetricLabel = (value: string) =>
	value
		.replace(/\{.*\}/, "")
		.replace(/_/g, " ")
		.replace(/\b\w/g, (char) => char.toUpperCase());

function BreakdownList({
	title,
	items,
	labelKey,
	valueKey,
}: {
	title: string;
	items: Array<Record<string, string | number>>;
	labelKey: string;
	valueKey: string;
}) {
	return (
		<div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
			<h4 className="text-sm font-semibold text-blue-950">{title}</h4>
			{items.length === 0 ? (
				<p className="mt-3 text-sm text-blue-900/70">No data available.</p>
			) : (
				<ul className="mt-3 space-y-2">
					{items.map((item) => (
						<li
							key={String(item[labelKey])}
							className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm"
						>
							<span className="text-blue-950">{String(item[labelKey])}</span>
							<span className="font-semibold text-blue-900">{String(item[valueKey])}</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

export default function Dashboard() {
	const [health, setHealth] = useState<HealthStatus | null>(null);
	const [live, setLive] = useState<HealthStatus | null>(null);
	const [ready, setReady] = useState<HealthStatus | null>(null);
	const [stats, setStats] = useState<GraphStats | null>(null);
	const [schema, setSchema] = useState<GraphSchema | null>(null);
	const [metricsPreview, setMetricsPreview] = useState<ParsedMetric[]>([]);
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
				setMetricsPreview(parseMetricsPreview(metrics));
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
					{stats ? (
						<div className="mt-3 space-y-4">
							<div className="grid gap-3 sm:grid-cols-2">
								<div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
									<p className="text-xs uppercase tracking-[0.18em] text-blue-700/70">
										Total Nodes
									</p>
									<p className="mt-2 text-3xl font-semibold text-blue-950">
										{stats.total_nodes.toLocaleString()}
									</p>
								</div>
								<div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
									<p className="text-xs uppercase tracking-[0.18em] text-blue-700/70">
										Total Relationships
									</p>
									<p className="mt-2 text-3xl font-semibold text-blue-950">
										{stats.total_relationships.toLocaleString()}
									</p>
								</div>
							</div>
							<div className="grid gap-4 lg:grid-cols-2">
								<BreakdownList
									title="Nodes By Label"
									items={stats.node_counts_by_label}
									labelKey="label"
									valueKey="count"
								/>
								<BreakdownList
									title="Relationships By Type"
									items={stats.relationship_counts_by_type}
									labelKey="relationship_type"
									valueKey="count"
								/>
							</div>
						</div>
					) : (
						<p className="mt-3 text-sm text-blue-900/70">Loading graph statistics...</p>
					)}
				</article>

				<article className="surface p-4">
					<h3 className="text-lg font-semibold text-blue-950">Graph Schema</h3>
					{schema ? (
						<div className="mt-3 grid gap-4 lg:grid-cols-2">
							<div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
								<p className="text-sm font-semibold text-blue-950">Node Labels</p>
								<div className="mt-3 flex flex-wrap gap-2">
									{schema.node_labels.length === 0 ? (
										<p className="text-sm text-blue-900/70">No node labels found.</p>
									) : (
										schema.node_labels.map((label) => (
											<span
												key={label}
												className="rounded-full border border-blue-200 bg-white px-3 py-1 text-sm text-blue-950"
											>
												{label}
											</span>
										))
									)}
								</div>
							</div>
							<div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
								<p className="text-sm font-semibold text-blue-950">Relationship Types</p>
								<div className="mt-3 flex flex-wrap gap-2">
									{schema.relationship_types.length === 0 ? (
										<p className="text-sm text-blue-900/70">No relationship types found.</p>
									) : (
										schema.relationship_types.map((type) => (
											<span
												key={type}
												className="rounded-full border border-blue-200 bg-white px-3 py-1 text-sm text-blue-950"
											>
												{type}
											</span>
										))
									)}
								</div>
							</div>
						</div>
					) : (
						<p className="mt-3 text-sm text-blue-900/70">Loading schema metadata...</p>
					)}
				</article>
			</section>

			<section className="surface p-4">
				<h3 className="text-lg font-semibold text-blue-950">Metrics Preview</h3>
				{metricsPreview.length > 0 ? (
					<div className="mt-3 space-y-4">
						<div className="grid gap-3 sm:grid-cols-3">
							<div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
								<p className="text-xs uppercase tracking-[0.18em] text-blue-700/70">
									Metrics Shown
								</p>
								<p className="mt-2 text-3xl font-semibold text-blue-950">
									{metricsPreview.length}
								</p>
							</div>
							<div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:col-span-2">
								<p className="text-xs uppercase tracking-[0.18em] text-blue-700/70">
									First Metric
								</p>
								<p className="mt-2 text-lg font-semibold text-blue-950">
									{formatMetricLabel(metricsPreview[0].name)}
								</p>
							</div>
						</div>

						<div className="overflow-x-auto rounded-2xl border border-blue-100">
							<table className="min-w-full text-left text-sm text-blue-950">
								<thead className="bg-blue-50">
									<tr>
										<th className="px-4 py-3 font-semibold">Metric</th>
										<th className="px-4 py-3 font-semibold">Value</th>
										<th className="px-4 py-3 font-semibold">Type</th>
										<th className="px-4 py-3 font-semibold">Description</th>
									</tr>
								</thead>
								<tbody>
									{metricsPreview.map((metric) => (
										<tr key={metric.name} className="border-t border-blue-100 bg-white align-top">
											<td className="px-4 py-3 font-medium">{formatMetricLabel(metric.name)}</td>
											<td className="px-4 py-3 mono text-xs">{metric.value}</td>
											<td className="px-4 py-3">{metric.type || "-"}</td>
											<td className="px-4 py-3 text-blue-900/75">{metric.help || "-"}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				) : (
					<p className="mt-3 text-sm text-blue-900/70">Loading metrics...</p>
				)}
			</section>
		</div>
	);
}