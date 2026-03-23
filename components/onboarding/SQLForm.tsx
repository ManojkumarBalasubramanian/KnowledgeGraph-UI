"use client";

import { useEffect, useState } from "react";
import { useMetadataHierarchy } from "@/hooks/useMetadataHierarchy";
import { formatAPIError } from "@/services/api";
import { fetchSQLCatalog, onboardSQL } from "@/services/onboardService";
import type { SQLCatalogSchema } from "@/types/api";
import SQLOnboardingPanel from "./sql/SQLOnboardingPanel";

export default function SQLForm() {
	const [connectionString, setConnectionString] = useState("");
	const [catalog, setCatalog] = useState<SQLCatalogSchema[]>([]);
	const [selectedSchema, setSelectedSchema] = useState("");
	const [selectedTable, setSelectedTable] = useState("");
	const [deltaOnly, setDeltaOnly] = useState(true);

	const [isOnboarding, setIsOnboarding] = useState(false);
	const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

	const [statusMessage, setStatusMessage] = useState("");
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

	const loadCatalog = async () => {
		setIsLoadingCatalog(true);
		setError("");

		try {
			const result = await fetchSQLCatalog({ connection_string: connectionString.trim() });
			setCatalog(result.schemas);
			setSelectedSchema("");
			setSelectedTable("");
			setStatusMessage(`Loaded ${result.schemas.length} schema(s).`);
		} catch (err) {
			setError(formatAPIError(err, "Failed to load schema/table catalog."));
		} finally {
			setIsLoadingCatalog(false);
		}
	};

	const updateSelectedSchema = (schema: string) => {
		setSelectedSchema(schema);
		setSelectedTable("");
	};

	const submit = async () => {
		setIsOnboarding(true);
		setError("");
		setStatusMessage("SQL onboarding started. Processing in background...");

		try {
			const payload = {
				connection_string: connectionString.trim(),
				delta_only: deltaOnly,
				sub_domain_id: selectedSubDomainId,
				...(selectedEnterpriseId ? { enterprise_id: selectedEnterpriseId } : {}),
				...(selectedDomainId ? { domain_id: selectedDomainId } : {}),
				...(selectedSchema ? { schema_name: selectedSchema } : {}),
				...(selectedTable ? { table_name: selectedTable } : {}),
			};

			const result = await onboardSQL(payload);
			const processedNodes = result.result?.ontology_count;
			if (typeof processedNodes === "number") {
				setStatusMessage(`${result.message} Processed ${processedNodes} node(s).`);
			} else {
				setStatusMessage(result.message);
			}
		} catch (err) {
			setError(formatAPIError(err, "SQL onboarding failed."));
		} finally {
			setIsOnboarding(false);
		}
	};

	return (
		<div className="space-y-6">
			<SQLOnboardingPanel
				domains={domains}
				selectedDomainId={selectedDomainId}
				onSelectedDomainIdChange={setSelectedDomainId}
				selectedSubDomainId={selectedSubDomainId}
				onSelectedSubDomainIdChange={setSelectedSubDomainId}
				subDomains={subDomains}
				isLoadingHierarchy={isLoadingHierarchy}
				connectionString={connectionString}
				onConnectionStringChange={setConnectionString}
				isOnboarding={isOnboarding}
				isLoadingCatalog={isLoadingCatalog}
				catalog={catalog}
				selectedSchema={selectedSchema}
				onSelectedSchemaChange={updateSelectedSchema}
				selectedTable={selectedTable}
				onSelectedTableChange={setSelectedTable}
				deltaOnly={deltaOnly}
				onDeltaOnlyChange={setDeltaOnly}
				onSubmit={submit}
				onLoadCatalog={loadCatalog}
			/>

			{statusMessage ? <p className="alert-success text-sm">{statusMessage}</p> : null}

			{error ? <pre className="alert-error overflow-auto text-xs">{error}</pre> : null}
		</div>
	);
}