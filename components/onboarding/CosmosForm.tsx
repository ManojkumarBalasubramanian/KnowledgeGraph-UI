"use client";

import { useEffect, useState } from "react";
import DomainSubDomainFields from "@/components/onboarding/shared/DomainSubDomainFields";
import { useMetadataHierarchy } from "@/hooks/useMetadataHierarchy";
import { APIRequestError, formatAPIError } from "@/services/api";
import { onboardCosmos } from "@/services/onboardService";
import type { CosmosOnboardResponse } from "@/types/api";

const COSMOS_DEFAULTS = {
	deltaOnly: true,
	parallelEnabled: true,
	maxWorkers: 4,
	rollupBatchEnabled: false,
} as const;

const getCosmosStartError = (err: unknown): string => {
	if (err instanceof APIRequestError) {
		switch (err.statusCode) {
			case 404:
				return "Selected Sub Domain was not found. Refresh hierarchy and try again.";
			case 422:
				return "Selected Domain/Enterprise does not match this Sub Domain.";
			case 500:
				return "Failed to start onboarding. Try again or contact support.";
			default:
				return formatAPIError(err, "Cosmos onboarding failed.");
		}
	}

	return formatAPIError(err, "Cosmos onboarding failed.");
};

export default function CosmosForm() {
	const [uri, setUri] = useState("");
	const [key, setKey] = useState("");
	const [databaseName, setDatabaseName] = useState("");
	const [deltaOnly, setDeltaOnly] = useState(COSMOS_DEFAULTS.deltaOnly);
	const [parallelEnabled, setParallelEnabled] = useState(COSMOS_DEFAULTS.parallelEnabled);
	const [maxWorkers, setMaxWorkers] = useState(COSMOS_DEFAULTS.maxWorkers);
	const [rollupBatchEnabled, setRollupBatchEnabled] = useState(
		COSMOS_DEFAULTS.rollupBatchEnabled,
	);
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

		const normalizedWorkers = Number.isFinite(maxWorkers)
			? Math.min(64, Math.max(1, Math.trunc(maxWorkers)))
			: COSMOS_DEFAULTS.maxWorkers;

		try {
			const result = await onboardCosmos({
				uri: uri.trim(),
				key: key.trim(),
				database_name: databaseName.trim(),
				sub_domain_id: selectedSubDomainId,
				...(deltaOnly !== COSMOS_DEFAULTS.deltaOnly ? { delta_only: deltaOnly } : {}),
				...(parallelEnabled !== COSMOS_DEFAULTS.parallelEnabled
					? { parallel_enabled: parallelEnabled }
					: {}),
				...(normalizedWorkers !== COSMOS_DEFAULTS.maxWorkers
					? { max_workers: normalizedWorkers }
					: {}),
				...(rollupBatchEnabled !== COSMOS_DEFAULTS.rollupBatchEnabled
					? { rollup_batch_enabled: rollupBatchEnabled }
					: {}),
				...(selectedEnterpriseId ? { enterprise_id: selectedEnterpriseId } : {}),
				...(selectedDomainId ? { domain_id: selectedDomainId } : {}),
			});
			setResponse(result);
		} catch (err) {
			setError(getCosmosStartError(err));
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

			<div className="space-y-3 rounded-xl border border-blue-100 bg-white/60 p-4">
				<p className="text-xs font-semibold uppercase tracking-wide text-blue-900/70">
					Advanced options
				</p>

				<label className="flex items-center gap-2 text-sm text-blue-950">
					<input
						type="checkbox"
						checked={deltaOnly}
						onChange={(event) => setDeltaOnly(event.target.checked)}
					/>
					Delta only
				</label>

				<label className="flex items-center gap-2 text-sm text-blue-950">
					<input
						type="checkbox"
						checked={parallelEnabled}
						onChange={(event) => setParallelEnabled(event.target.checked)}
					/>
					Parallel enabled
				</label>

				<label className="block text-sm text-blue-950">
					<span className="mb-1 block">Max workers</span>
					<input
						className="input-field"
						type="number"
						min={1}
						max={64}
						value={maxWorkers}
						onChange={(event) => setMaxWorkers(Number(event.target.value || 1))}
					/>
				</label>

				<label className="flex items-center gap-2 text-sm text-blue-950">
					<input
						type="checkbox"
						checked={rollupBatchEnabled}
						onChange={(event) => setRollupBatchEnabled(event.target.checked)}
					/>
					Rollup batch enabled
				</label>
			</div>

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
				<p className="alert-success text-xs">{response.message}</p>
			) : null}
		</section>
	);
}