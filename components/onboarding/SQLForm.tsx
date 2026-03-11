"use client";

import { useMemo, useState } from "react";
import { APIRequestError } from "@/services/api";
import {
	getSQLDescriptionsDiagnostics,
	listSQLDescriptions,
	onboardSQL,
} from "@/services/onboardService";
import type {
	SQLDescriptionItem,
	SQLDescriptionsDiagnosticsResponse,
	SQLOnboardResponse,
} from "@/types/api";
import type { SQLApprovedFilter } from "./sql/types";
import SQLDiagnosticsPanel from "./sql/SQLDiagnosticsPanel";
import SQLOnboardingPanel from "./sql/SQLOnboardingPanel";
import SQLReviewQueuePanel from "./sql/SQLReviewQueuePanel";

export default function SQLForm() {
	const [connectionString, setConnectionString] = useState("");
	const [approvedFilter, setApprovedFilter] = useState<SQLApprovedFilter>("No");
	const [databaseFilter, setDatabaseFilter] = useState("");
	const [schemaFilter, setSchemaFilter] = useState("");
	const [tableFilter, setTableFilter] = useState("");
	const [queueLimit, setQueueLimit] = useState("200");

	const [isOnboarding, setIsOnboarding] = useState(false);
	const [isLoadingQueue, setIsLoadingQueue] = useState(false);
	const [isLoadingDiagnostics, setIsLoadingDiagnostics] = useState(false);

	const [onboardResponse, setOnboardResponse] = useState<SQLOnboardResponse | null>(null);
	const [diagnostics, setDiagnostics] = useState<SQLDescriptionsDiagnosticsResponse | null>(null);

	const [queue, setQueue] = useState<SQLDescriptionItem[]>([]);

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

	const filteredQueue = useMemo(() => {
		const db = databaseFilter.trim().toLowerCase();
		const schema = schemaFilter.trim().toLowerCase();
		const table = tableFilter.trim().toLowerCase();

		return queue.filter((item) => {
			const dbMatch = !db || item.database_name.toLowerCase().includes(db);
			const schemaMatch = !schema || item.schema_name.toLowerCase().includes(schema);
			const tableMatch = !table || item.table_name.toLowerCase().includes(table);

			return dbMatch && schemaMatch && tableMatch;
		});
	}, [databaseFilter, queue, schemaFilter, tableFilter]);

	const safeNumber = (value: string, fallback: number) => {
		const parsed = Number(value);
		if (!Number.isFinite(parsed) || parsed <= 0) {
			return fallback;
		}
		return Math.floor(parsed);
	};

	const loadQueue = async () => {
		setIsLoadingQueue(true);
		setError("");

		try {
			const result = await listSQLDescriptions({
				connection_string: connectionString.trim() || null,
				approved: approvedFilter || null,
				limit: safeNumber(queueLimit, 200),
			});

			setQueue(result.items);
		} catch (err) {
			setError(formatError(err, "Failed to load SQL description queue."));
		} finally {
			setIsLoadingQueue(false);
		}
	};

	const submit = async () => {
		setIsOnboarding(true);
		setError("");
		setOnboardResponse(null);
		setStatusMessage("");

		try {
			const result = await onboardSQL({ connection_string: connectionString.trim() });
			setOnboardResponse(result);
			setStatusMessage(result.message);
		} catch (err) {
			setError(formatError(err, "SQL onboarding failed."));
		} finally {
			setIsOnboarding(false);
		}
	};

	const loadDiagnostics = async () => {
		setIsLoadingDiagnostics(true);
		setError("");
		setDiagnostics(null);

		try {
			const result = await getSQLDescriptionsDiagnostics({
				connection_string: connectionString.trim() || null,
			});
			setDiagnostics(result);
		} catch (err) {
			setError(formatError(err, "Failed to load diagnostics."));
		} finally {
			setIsLoadingDiagnostics(false);
		}
	};

	return (
		<div className="space-y-6">
			<SQLOnboardingPanel
				connectionString={connectionString}
				onConnectionStringChange={setConnectionString}
				isOnboarding={isOnboarding}
				isLoadingQueue={isLoadingQueue}
				onSubmit={submit}
				onLoadQueue={loadQueue}
				onboardResponse={onboardResponse}
			/>

			<SQLReviewQueuePanel
				approvedFilter={approvedFilter}
				onApprovedFilterChange={setApprovedFilter}
				databaseFilter={databaseFilter}
				onDatabaseFilterChange={setDatabaseFilter}
				schemaFilter={schemaFilter}
				onSchemaFilterChange={setSchemaFilter}
				tableFilter={tableFilter}
				onTableFilterChange={setTableFilter}
				queueLimit={queueLimit}
				onQueueLimitChange={setQueueLimit}
				filteredQueue={filteredQueue}
			/>

			<SQLDiagnosticsPanel
				isLoadingDiagnostics={isLoadingDiagnostics}
				onLoadDiagnostics={loadDiagnostics}
				diagnostics={diagnostics}
			/>

			{statusMessage ? <p className="alert-success text-sm">{statusMessage}</p> : null}

			{error ? <pre className="alert-error overflow-auto text-xs">{error}</pre> : null}
		</div>
	);
}