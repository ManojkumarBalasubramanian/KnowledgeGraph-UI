"use client";

import { useState } from "react";
import { APIRequestError } from "@/services/api";
import { createManualRelationship } from "@/services/relationshipService";
import { NODE_LABELS, RELATIONSHIP_TYPES } from "@/types/api";

export default function EnterprisePage() {
	const [sourceLabel, setSourceLabel] = useState("Table");
	const [sourceName, setSourceName] = useState("");
	const [targetLabel, setTargetLabel] = useState("Table");
	const [targetName, setTargetName] = useState("");
	const [relation, setRelation] = useState("REFERENCES");
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const submit = async () => {
		setIsLoading(true);
		setMessage("");
		setError("");
		try {
			const response = await createManualRelationship({
				source_label: sourceLabel,
				source_name: sourceName.trim(),
				target_label: targetLabel,
				target_name: targetName.trim(),
				relation,
			});
			setMessage(response.message);
		} catch (err) {
			if (err instanceof APIRequestError) {
				setError(
					typeof err.detail === "string"
						? err.detail
						: JSON.stringify(err.detail, null, 2),
				);
			} else {
				setError("Relationship creation failed.");
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<section className="surface max-w-3xl p-6">
			<h2 className="font-display text-3xl text-blue-950">Manual Relationship Manager</h2>
			<p className="mt-1 text-sm text-blue-900/75">
				Create custom relationships such as REFERENCES, DERIVED_FROM, and DEPENDS_ON.
			</p>

			<div className="mt-5 grid gap-3 md:grid-cols-2">
				<select
					className="select-field"
					onChange={(event) => setSourceLabel(event.target.value)}
					value={sourceLabel}
				>
					{NODE_LABELS.map((label) => (
						<option key={label} value={label}>
							{label}
						</option>
					))}
				</select>
				<input
					className="input-field"
					onChange={(event) => setSourceName(event.target.value)}
					placeholder="Source node name"
					value={sourceName}
				/>
				<select
					className="select-field"
					onChange={(event) => setTargetLabel(event.target.value)}
					value={targetLabel}
				>
					{NODE_LABELS.map((label) => (
						<option key={label} value={label}>
							{label}
						</option>
					))}
				</select>
				<input
					className="input-field"
					onChange={(event) => setTargetName(event.target.value)}
					placeholder="Target node name"
					value={targetName}
				/>
			</div>

			<select
				className="select-field mt-3"
				onChange={(event) => setRelation(event.target.value)}
				value={relation}
			>
				{RELATIONSHIP_TYPES.map((type) => (
					<option key={type} value={type}>
						{type}
					</option>
				))}
			</select>

			<button
				className="btn-primary mt-4"
				disabled={
					isLoading || !sourceName.trim() || !targetName.trim() || !sourceLabel || !targetLabel
				}
				onClick={submit}
				type="button"
			>
				{isLoading ? "Creating..." : "Create Relationship"}
			</button>

			{message ? (
				<p className="alert-success mt-4 text-sm">
					{message}
				</p>
			) : null}

			{error ? (
				<pre className="alert-error mt-4 overflow-auto text-xs">
					{error}
				</pre>
			) : null}
		</section>
	);
}
