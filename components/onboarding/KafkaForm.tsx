"use client";

import { useEffect, useState } from "react";
import DomainSubDomainFields from "@/components/onboarding/shared/DomainSubDomainFields";
import { useMetadataHierarchy } from "@/hooks/useMetadataHierarchy";
import { formatAPIError } from "@/services/api";
import { onboardKafka } from "@/services/onboardService";
import type { KafkaOnboardResponse } from "@/types/api";

export default function KafkaForm() {
	const [bootstrapServers, setBootstrapServers] = useState("localhost:9092");
	const [isLoading, setIsLoading] = useState(false);
	const [response, setResponse] = useState<KafkaOnboardResponse | null>(null);
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
			const result = await onboardKafka({
				bootstrap_servers: bootstrapServers.trim(),
				sub_domain_id: selectedSubDomainId,
				...(selectedEnterpriseId ? { enterprise_id: selectedEnterpriseId } : {}),
				...(selectedDomainId ? { domain_id: selectedDomainId } : {}),
			});
			setResponse(result);
		} catch (err) {
			setError(formatAPIError(err, "Kafka onboarding failed."));
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<section className="surface space-y-4 p-6">
			<h2 className="font-display text-2xl text-blue-950">Kafka Topic Onboarding</h2>

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
				placeholder="localhost:9092"
				value={bootstrapServers}
				onChange={(event) => setBootstrapServers(event.target.value)}
			/>

			<button
				className="btn-primary"
				disabled={isLoading || !selectedSubDomainId || !bootstrapServers.trim()}
				onClick={submit}
				type="button"
			>
				{isLoading ? "Running..." : "Onboard Kafka"}
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