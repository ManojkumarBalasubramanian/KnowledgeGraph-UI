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
	const [advancedPerformanceEnabled, setAdvancedPerformanceEnabled] = useState(false);
	const [parallelEnabledSelection, setParallelEnabledSelection] = useState<"" | "true" | "false">("");
	const [maxWorkersInput, setMaxWorkersInput] = useState("");
	const [rollupBatchEnabledSelection, setRollupBatchEnabledSelection] = useState<
		"" | "true" | "false"
	>("");

	const [isOnboarding, setIsOnboarding] = useState(false);
	const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

	const [statusMessage, setStatusMessage] = useState("");
	const [optimizationMessage, setOptimizationMessage] = useState("");
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

	const parseBooleanSelection = (
		value: "" | "true" | "false",
	): boolean | undefined => {
		if (value === "true") {
			return true;
		}
		if (value === "false") {
			return false;
		}
		return undefined;
	};

	const validate = (): string | null => {
		if (!selectedSubDomainId.trim()) {
			return "Sub-domain is required.";
		}

		if (selectedTable.trim() && !selectedSchema.trim()) {
			return "Schema is required when a table is selected.";
		}

		if (advancedPerformanceEnabled && maxWorkersInput.trim()) {
			const parsed = Number(maxWorkersInput);
			if (!Number.isInteger(parsed) || parsed < 1 || parsed > 32) {
				return "Max workers must be an integer between 1 and 32.";
			}
		}

		return null;
	};

	const submit = async () => {
		const validationError = validate();
		if (validationError) {
			setError(validationError);
			return;
		}

		setIsOnboarding(true);
		setError("");
		setOptimizationMessage("");
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
				...(advancedPerformanceEnabled
					? {
						...(parseBooleanSelection(parallelEnabledSelection) !== undefined
							? {
								parallel_enabled: parseBooleanSelection(parallelEnabledSelection),
							}
							: {}),
						...(parseBooleanSelection(rollupBatchEnabledSelection) !== undefined
							? {
								rollup_batch_enabled: parseBooleanSelection(rollupBatchEnabledSelection),
							}
							: {}),
						...(maxWorkersInput.trim()
							? {
								max_workers: Number(maxWorkersInput),
							}
							: {}),
				  }
					: {}),
			};

			const result = await onboardSQL(payload);
			const processedNodes = result.result?.ontology_count;
			if (typeof processedNodes === "number") {
				setStatusMessage(`${result.message} Processed ${processedNodes} node(s).`);
			} else {
				setStatusMessage(result.message);
			}

			if (result.optimization) {
				setOptimizationMessage(
					`Effective optimization: parallel=${result.optimization.parallel_enabled ? "on" : "off"}, max_workers=${result.optimization.max_workers}, rollup_batch=${result.optimization.rollup_batch_enabled ? "on" : "off"}.`,
				);
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
				advancedPerformanceEnabled={advancedPerformanceEnabled}
				onAdvancedPerformanceEnabledChange={setAdvancedPerformanceEnabled}
				parallelEnabledSelection={parallelEnabledSelection}
				onParallelEnabledSelectionChange={setParallelEnabledSelection}
				maxWorkersInput={maxWorkersInput}
				onMaxWorkersInputChange={setMaxWorkersInput}
				rollupBatchEnabledSelection={rollupBatchEnabledSelection}
				onRollupBatchEnabledSelectionChange={setRollupBatchEnabledSelection}
				optimizationMessage={optimizationMessage}
				onSubmit={submit}
				onLoadCatalog={loadCatalog}
			/>

			{statusMessage ? <p className="alert-success text-sm">{statusMessage}</p> : null}

			{error ? <pre className="alert-error overflow-auto text-xs">{error}</pre> : null}
		</div>
	);
}