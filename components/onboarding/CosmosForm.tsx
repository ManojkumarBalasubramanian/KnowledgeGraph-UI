"use client";

import { useEffect, useState } from "react";
import DomainSubDomainFields from "@/components/onboarding/shared/DomainSubDomainFields";
import { useMetadataHierarchy } from "@/hooks/useMetadataHierarchy";
import { formatAPIError } from "@/services/api";
import { onboardCosmos } from "@/services/onboardService";
import type { CosmosOnboardResponse } from "@/types/api";

export default function CosmosForm() {
	const [uri, setUri] = useState("");
	const [key, setKey] = useState("");
	const [databaseName, setDatabaseName] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [response, setResponse] = useState<CosmosOnboardResponse | null>(null);
	const [error, setError] = useState("");
	const {
		domains,
		selectedDomainId,
		setSelectedDomainId,
		selectedSubDomainId,
		setSelectedSubDomainId,
		selectedEnterpriseId,
		subDomains,
		isLoadingHierarchy,
		hierarchyError,
	} = useMetadataHierarchy();

	useEffect(() => {
		if (hierarchyError) {
			setError(hierarchyError);
		}
	}, [hierarchyError]);

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
				...(selectedEnterpriseId ? { enterprise_id: selectedEnterpriseId } : {}),
				...(selectedDomainId ? { domain_id: selectedDomainId } : {}),
			});
			setResponse(result);
		} catch (err) {
			setError(formatAPIError(err, "Cosmos onboarding failed."));
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<section className="surface space-y-4 p-6">
			<h2 className="font-display text-2xl text-blue-950">Azure Cosmos DB Onboarding</h2>

			<DomainSubDomainFields
				domains={domains}
				subDomains={subDomains}
				selectedDomainId={selectedDomainId}
				onSelectedDomainIdChange={setSelectedDomainId}
				selectedSubDomainId={selectedSubDomainId}
				onSelectedSubDomainIdChange={setSelectedSubDomainId}
				isLoadingHierarchy={isLoadingHierarchy}
			/>

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