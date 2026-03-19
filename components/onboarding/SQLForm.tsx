"use client";

import { useEffect, useState } from "react";
import { APIRequestError } from "@/services/api";
import { getMetadataExplorerHierarchy } from "@/services/graphService";
import {
	fetchSQLCatalog,
	onboardSQL,
} from "@/services/onboardService";
import type {
	SQLCatalogSchema,
	MetadataExplorerDomain,
} from "@/types/api";
import SQLOnboardingPanel from "./sql/SQLOnboardingPanel";

export default function SQLForm() {
	const [connectionString, setConnectionString] = useState("");
	const [domains, setDomains] = useState<MetadataExplorerDomain[]>([]);
	const [selectedDomainId, setSelectedDomainId] = useState("");
	const [selectedSubDomainId, setSelectedSubDomainId] = useState("");
	const [catalog, setCatalog] = useState<SQLCatalogSchema[]>([]);
	const [selectedSchema, setSelectedSchema] = useState("");
	const [selectedTable, setSelectedTable] = useState("");
	const [deltaOnly, setDeltaOnly] = useState(true);

	const [isOnboarding, setIsOnboarding] = useState(false);
	const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
	const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(false);

	const [statusMessage, setStatusMessage] = useState("");
	const [error, setError] = useState("");

	const formatError = (err: unknown, fallbackMessage: string): string => {
		if (err instanceof APIRequestError) {
			return typeof err.detail === "string"
				? err.detail
				: JSON.stringify(err.detail, null, 2);
		}

		return fallbackMessage;
	};

	useEffect(() => {
		const loadHierarchy = async () => {
			setIsLoadingHierarchy(true);
			setError("");

			try {
				const result = await getMetadataExplorerHierarchy();
				setDomains(result.domains);
			} catch (err) {
				setError(formatError(err, "Failed to load Domain/Sub Domain hierarchy."));
			} finally {
				setIsLoadingHierarchy(false);
			}
		};

		void loadHierarchy();
	}, []);

	useEffect(() => {
		setSelectedSubDomainId("");
	}, [selectedDomainId]);

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
			setError(formatError(err, "Failed to load schema/table catalog."));
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
			setError(formatError(err, "SQL onboarding failed."));
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