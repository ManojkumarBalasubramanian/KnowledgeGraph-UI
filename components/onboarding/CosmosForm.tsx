"use client";

import { useEffect, useMemo, useState } from "react";
import { APIRequestError } from "@/services/api";
import { getMetadataExplorerHierarchy } from "@/services/graphService";
import { onboardCosmos } from "@/services/onboardService";
import type { CosmosOnboardResponse, MetadataExplorerDomain } from "@/types/api";

export default function CosmosForm() {
	const [domains, setDomains] = useState<MetadataExplorerDomain[]>([]);
	const [selectedDomainId, setSelectedDomainId] = useState("");
	const [selectedSubDomainId, setSelectedSubDomainId] = useState("");
	const [uri, setUri] = useState("");
	const [key, setKey] = useState("");
	const [databaseName, setDatabaseName] = useState("");
	const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [response, setResponse] = useState<CosmosOnboardResponse | null>(null);
	const [error, setError] = useState("");

	const selectedDomain = useMemo(
		() => domains.find((domain) => domain.id === selectedDomainId) ?? null,
		[domains, selectedDomainId],
	);

	const subDomains = selectedDomain?.sub_domains ?? [];

	useEffect(() => {
		const loadHierarchy = async () => {
			setIsLoadingHierarchy(true);
			setError("");

			try {
				const result = await getMetadataExplorerHierarchy();
				setDomains(result.domains);
			} catch (err) {
				if (err instanceof APIRequestError) {
					setError(
						typeof err.detail === "string"
							? err.detail
							: JSON.stringify(err.detail, null, 2),
					);
				} else {
					setError("Failed to load Domain/Sub Domain hierarchy.");
				}
			} finally {
				setIsLoadingHierarchy(false);
			}
		};

		void loadHierarchy();
	}, []);

	useEffect(() => {
		setSelectedSubDomainId("");
	}, [selectedDomainId]);

	const submit = async () => {
		setIsLoading(true);
		setError("");
		setResponse(null);

		try {
			const result = await onboardCosmos({
				uri: uri.trim(),
				key: key.trim(),
				database_name: databaseName.trim(),
				sub_domain_id: selectedSubDomainId,
				...(selectedDomainId ? { domain_id: selectedDomainId } : {}),
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

			<div className="grid gap-3 md:grid-cols-2">
				<label className="space-y-1 text-sm text-blue-900">
					<span className="font-medium">Domain</span>
					<select
						className="select-field"
						disabled={isLoadingHierarchy || domains.length === 0}
						value={selectedDomainId}
						onChange={(event) => setSelectedDomainId(event.target.value)}
					>
						<option value="">Select domain...</option>
						{domains.map((domain) => (
							<option key={domain.id} value={domain.id}>
								{domain.name}
							</option>
						))}
					</select>
				</label>

				<label className="space-y-1 text-sm text-blue-900">
					<span className="font-medium">Sub Domain</span>
					<select
						className="select-field"
						disabled={!selectedDomainId || isLoadingHierarchy}
						value={selectedSubDomainId}
						onChange={(event) => setSelectedSubDomainId(event.target.value)}
					>
						<option value="">Select sub domain...</option>
						{subDomains.map((subDomain) => (
							<option key={subDomain.id} value={subDomain.id}>
								{subDomain.name}
							</option>
						))}
					</select>
				</label>
			</div>

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
				disabled={
					isLoading ||
					!selectedSubDomainId ||
					!uri.trim() ||
					!key.trim() ||
					!databaseName.trim()
				}
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