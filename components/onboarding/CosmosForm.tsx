"use client";

import { useState } from "react";
import { APIRequestError } from "@/services/api";
import { onboardCosmos } from "@/services/onboardService";
import type { CosmosOnboardResponse } from "@/types/api";

export default function CosmosForm() {
	const [uri, setUri] = useState("");
	const [key, setKey] = useState("");
	const [databaseName, setDatabaseName] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [response, setResponse] = useState<CosmosOnboardResponse | null>(null);
	const [error, setError] = useState("");

	const submit = async () => {
		setIsLoading(true);
		setError("");
		setResponse(null);

		try {
			const result = await onboardCosmos({
				uri: uri.trim(),
				key: key.trim(),
				database_name: databaseName.trim(),
			});
			setResponse(result);
		} catch (err) {
			if (err instanceof APIRequestError) {
				setError(
					typeof err.detail === "string"
						? err.detail
						: JSON.stringify(err.detail, null, 2),
				);
			} else {
				setError("Cosmos onboarding failed.");
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<section className="surface space-y-4 p-6">
			<h2 className="font-display text-2xl text-blue-950">Azure Cosmos DB Onboarding</h2>

			<input
				className="input-field"
				placeholder="https://myaccount.documents.azure.com:443/"
				value={uri}
				onChange={(event) => setUri(event.target.value)}
			/>

			<input
				className="input-field"
				placeholder="Primary or secondary key"
				type="password"
				value={key}
				onChange={(event) => setKey(event.target.value)}
			/>

			<input
				className="input-field"
				placeholder="Database name"
				value={databaseName}
				onChange={(event) => setDatabaseName(event.target.value)}
			/>

			<button
				className="btn-primary"
				disabled={isLoading || !uri.trim() || !key.trim() || !databaseName.trim()}
				onClick={submit}
				type="button"
			>
				{isLoading ? "Running..." : "Onboard Cosmos DB"}
			</button>

			{error ? (
				<pre className="alert-error overflow-auto text-xs">
					{error}
				</pre>
			) : null}

			{response ? (
				<pre className="alert-success overflow-auto text-xs">
					{JSON.stringify(response, null, 2)}
				</pre>
			) : null}
		</section>
	);
}