"use client";

import { useState } from "react";
import { APIRequestError } from "@/services/api";
import { searchGraphNodes } from "@/services/graphService";
import { NODE_LABELS } from "@/types/api";
import type { NodeSearchResponse } from "@/types/api";

export default function SubdomainsPage() {
	const [label, setLabel] = useState<(typeof NODE_LABELS)[number]>("Table");
	const [propertyName, setPropertyName] = useState("name");
	const [propertyValue, setPropertyValue] = useState("");
	const [result, setResult] = useState<NodeSearchResponse | null>(null);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const runSearch = async () => {
		setIsLoading(true);
		setError("");
		try {
			const response = await searchGraphNodes({
				label,
				property_name: propertyName.trim() || undefined,
				property_value: propertyValue.trim() || undefined,
			});
			setResult(response);
		} catch (err) {
			if (err instanceof APIRequestError) {
				setError(
					typeof err.detail === "string"
						? err.detail
						: JSON.stringify(err.detail, null, 2),
				);
			} else {
				setError("Node search failed.");
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<section className="surface p-6">
			<h2 className="font-display text-3xl text-blue-950">Node Search</h2>
			<p className="mt-1 text-sm text-blue-900/75">
				Search nodes by label with optional case-insensitive property filtering.
			</p>

			<div className="mt-4 grid gap-3 md:grid-cols-3">
				<select
					className="select-field"
					onChange={(event) => setLabel(event.target.value as (typeof NODE_LABELS)[number])}
					value={label}
				>
					{NODE_LABELS.map((nodeLabel) => (
						<option key={nodeLabel} value={nodeLabel}>
							{nodeLabel}
						</option>
					))}
				</select>

				<input
					className="input-field"
					onChange={(event) => setPropertyName(event.target.value)}
					placeholder="property_name"
					value={propertyName}
				/>

				<input
					className="input-field"
					onChange={(event) => setPropertyValue(event.target.value)}
					placeholder="property_value"
					value={propertyValue}
				/>
			</div>

			<button
				className="btn-primary mt-4"
				disabled={isLoading || !label}
				onClick={runSearch}
				type="button"
			>
				{isLoading ? "Searching..." : "Search Nodes"}
			</button>

			{error ? (
				<pre className="alert-error mt-4 overflow-auto text-xs">
					{error}
				</pre>
			) : null}

			<pre className="mono code-panel mt-4 max-h-[32rem] overflow-auto text-xs">
				{result ? JSON.stringify(result, null, 2) : "Run a search to list nodes."}
			</pre>
		</section>
	);
}
