"use client";

import { useEffect, useMemo, useState } from "react";
import { formatAPIError } from "@/services/api";
import { getMetadataExplorerHierarchy, queryGraph } from "@/services/graphService";
import type {
	MetadataExplorerDomain,
	MetadataExplorerSchema,
	MetadataExplorerStore,
	MetadataExplorerSubDomain,
} from "@/types/api";

interface SQLColumnRow {
	key: string;
	domain: string;
	subDomain: string;
	server: string;
	database: string;
	schema: string;
	table: string;
	column: string;
	dataType: string;
	businessDescription: string;
	llmConfidence: string;
}

const toStringValue = (value: unknown, fallback = "-"): string => {
	if (typeof value === "string") {
		return value.trim() || fallback;
	}
	if (typeof value === "number") {
		return String(value);
	}
	if (typeof value === "boolean") {
		return value ? "true" : "false";
	}
	return fallback;
};

const toNumberString = (value: unknown): string => {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value.toFixed(2);
	}
	if (typeof value === "string" && value.trim()) {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) {
			return parsed.toFixed(2);
		}
	}
	return "-";
};

export default function SubdomainsPage() {
	const [domains, setDomains] = useState<MetadataExplorerDomain[]>([]);
	const [selectedDomainId, setSelectedDomainId] = useState("");
	const [selectedSubDomainId, setSelectedSubDomainId] = useState("");
	const [selectedDatabaseId, setSelectedDatabaseId] = useState("");
	const [selectedSchemaId, setSelectedSchemaId] = useState("");
	const [selectedTableId, setSelectedTableId] = useState("");
	const [rows, setRows] = useState<SQLColumnRow[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [error, setError] = useState("");
	const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		const loadHierarchy = async () => {
			setIsLoadingHierarchy(true);
			setError("");

			try {
				const response = await getMetadataExplorerHierarchy();
				setDomains(response.domains);
			} catch (err) {
				setError(formatAPIError(err, "Failed to load hierarchy."));
			} finally {
				setIsLoadingHierarchy(false);
			}
		};

		void loadHierarchy();
	}, []);

	const selectedDomain = useMemo(
		() => domains.find((domain) => domain.id === selectedDomainId) ?? null,
		[domains, selectedDomainId],
	);

	const availableSubDomains = useMemo(() => {
		if (selectedDomain) {
			return selectedDomain.sub_domains;
		}
		return domains.flatMap((domain) => domain.sub_domains);
	}, [domains, selectedDomain]);

	const availableDatabases = useMemo(() => {
		const sourceSubDomains = selectedSubDomainId
			? availableSubDomains.filter((subDomain) => subDomain.id === selectedSubDomainId)
			: availableSubDomains;

		const allStores = sourceSubDomains.flatMap((subDomain) => subDomain.stores);
		const sqlDatabases = allStores.filter((store) => store.store_type === "Database");

		const unique = new Map<string, MetadataExplorerStore>();
		sqlDatabases.forEach((store) => {
			if (!unique.has(store.id)) {
				unique.set(store.id, store);
			}
		});

		return Array.from(unique.values());
	}, [availableSubDomains, selectedSubDomainId]);

	const availableSchemas = useMemo(() => {
		const selectedDatabases = selectedDatabaseId
			? availableDatabases.filter((database) => database.id === selectedDatabaseId)
			: availableDatabases;

		const schemas = selectedDatabases.flatMap((database) => database.schemas);
		const unique = new Map<string, MetadataExplorerSchema>();
		schemas.forEach((schema) => {
			if (!unique.has(schema.id)) {
				unique.set(schema.id, schema);
			}
		});

		return Array.from(unique.values());
	}, [availableDatabases, selectedDatabaseId]);

	const availableTables = useMemo(() => {
		const selectedDatabases = selectedDatabaseId
			? availableDatabases.filter((database) => database.id === selectedDatabaseId)
			: availableDatabases;

		const tables = selectedDatabases.flatMap((database) =>
			database.schemas
				.filter((schema) => !selectedSchemaId || schema.id === selectedSchemaId)
				.flatMap((schema) =>
				schema.assets
					.filter((asset) => asset.asset_type === "Table")
					.map((asset) => ({ id: asset.id, name: asset.name })),
				),
		);

		const unique = new Map<string, { id: string; name: string }>();
		tables.forEach((table) => {
			if (!unique.has(table.id)) {
				unique.set(table.id, table);
			}
		});

		return Array.from(unique.values());
	}, [availableDatabases, selectedDatabaseId, selectedSchemaId]);

	const selectedSubDomain = useMemo(
		() => availableSubDomains.find((subDomain) => subDomain.id === selectedSubDomainId) ?? null,
		[availableSubDomains, selectedSubDomainId],
	);

	const selectedDatabase = useMemo(
		() => availableDatabases.find((database) => database.id === selectedDatabaseId) ?? null,
		[availableDatabases, selectedDatabaseId],
	);

	const selectedSchema = useMemo(
		() => availableSchemas.find((schema) => schema.id === selectedSchemaId) ?? null,
		[availableSchemas, selectedSchemaId],
	);

	const selectedTable = useMemo(
		() => availableTables.find((table) => table.id === selectedTableId) ?? null,
		[availableTables, selectedTableId],
	);

	const databaseScopeNames = useMemo(() => {
		if (!(selectedDomainId || selectedSubDomainId || selectedDatabaseId)) {
			return [] as string[];
		}
		return Array.from(
			new Set(availableDatabases.map((database) => database.name).filter(Boolean)),
		);
	}, [availableDatabases, selectedDatabaseId, selectedDomainId, selectedSubDomainId]);

	const schemaScopeNames = useMemo(() => {
		if (!(selectedSubDomainId || selectedDatabaseId || selectedSchemaId)) {
			return [] as string[];
		}
		return Array.from(new Set(availableSchemas.map((schema) => schema.name).filter(Boolean)));
	}, [availableSchemas, selectedDatabaseId, selectedSchemaId, selectedSubDomainId]);

	const tableScopeNames = useMemo(() => {
		if (!(selectedDatabaseId || selectedSchemaId || selectedTableId)) {
			return [] as string[];
		}
		return Array.from(new Set(availableTables.map((table) => table.name).filter(Boolean)));
	}, [availableTables, selectedDatabaseId, selectedSchemaId, selectedTableId]);

	useEffect(() => {
		setSelectedSubDomainId("");
		setSelectedDatabaseId("");
		setSelectedSchemaId("");
		setSelectedTableId("");
	}, [selectedDomainId]);

	useEffect(() => {
		setSelectedDatabaseId("");
		setSelectedSchemaId("");
		setSelectedTableId("");
	}, [selectedSubDomainId]);

	useEffect(() => {
		setSelectedSchemaId("");
		setSelectedTableId("");
	}, [selectedDatabaseId]);

	useEffect(() => {
		setSelectedTableId("");
	}, [selectedSchemaId]);

	const loadColumns = async () => {
		setIsLoading(true);
		setError("");
		try {
			const response = await queryGraph({
				query: `
					MATCH (db:Database)-[:HAS_SCHEMA]->(s:Schema)-[:HAS_TABLE]->(t:Table)-[:HAS_COLUMN]->(c:Column)
					OPTIONAL MATCH (sd:SubDomain)-[:USES_SQLSERVER]->(db)
					OPTIONAL MATCH (d:Domain)-[:HAS_SUBDOMAIN]->(sd)
					WHERE ($domainId = '' OR d.id = $domainId OR d.name = $domainName)
					  AND ($subDomainId = '' OR sd.id = $subDomainId OR sd.name = $subDomainName)
					  AND ($databaseId = '' OR db.id = $databaseId OR db.name = $databaseName)
					  AND ($schemaId = '' OR s.id = $schemaId OR s.name = $schemaName)
					  AND ($tableId = '' OR t.id = $tableId OR t.name = $tableName)
					  AND (size($databaseScopeNames) = 0 OR coalesce(db.name, db.id, '') IN $databaseScopeNames)
					  AND (size($schemaScopeNames) = 0 OR coalesce(s.name, s.id, '') IN $schemaScopeNames)
					  AND (size($tableScopeNames) = 0 OR coalesce(t.name, t.id, '') IN $tableScopeNames)
					RETURN
						coalesce(d.name, 'Unassigned') AS domain,
						coalesce(sd.name, 'Unassigned') AS subDomain,
						coalesce(db.server_name, db.server, db.sql_server, db.host, 'Unknown') AS server,
						coalesce(db.name, db.id, 'Unknown') AS database,
						coalesce(s.name, s.id, 'Unknown') AS schema,
						coalesce(t.name, t.id, 'Unknown') AS table,
						coalesce(c.name, c.id, 'Unknown') AS column,
						coalesce(c.data_type, c.type, '-') AS dataType,
						coalesce(c.business_description, '-') AS businessDescription,
						c.llm_confidence AS llmConfidence,
						coalesce(t.id, t.name, '') + '|' + coalesce(c.id, c.name, '') AS rowKey
					ORDER BY domain, subDomain, server, database, schema, table, column
				`,
				parameters: {
					domainId: selectedDomainId,
					domainName: selectedDomain?.name ?? "",
					subDomainId: selectedSubDomainId,
					subDomainName: selectedSubDomain?.name ?? "",
					databaseId: selectedDatabaseId,
					databaseName: selectedDatabase?.name ?? "",
					schemaId: selectedSchemaId,
					schemaName: selectedSchema?.name ?? "",
					tableId: selectedTableId,
					tableName: selectedTable?.name ?? "",
					databaseScopeNames,
					schemaScopeNames,
					tableScopeNames,
				},
			});

			const mappedRows = response.results.map((item, index) => ({
				key: toStringValue(item.rowKey, `row-${index}`),
				domain: toStringValue(item.domain),
				subDomain: toStringValue(item.subDomain),
				server: toStringValue(item.server),
				database: toStringValue(item.database),
				schema: toStringValue(item.schema),
				table: toStringValue(item.table),
				column: toStringValue(item.column),
				dataType: toStringValue(item.dataType),
				businessDescription: toStringValue(item.businessDescription),
				llmConfidence: toNumberString(item.llmConfidence),
			}));

			setRows(mappedRows);
			setTotalCount(response.count);
		} catch (err) {
			setError(formatAPIError(err, "Failed to load SQL column grid."));
			setRows([]);
			setTotalCount(0);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (!isLoadingHierarchy) {
			void loadColumns();
		}
		// Auto refresh whenever filter selection changes.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		isLoadingHierarchy,
		selectedDomainId,
		selectedSubDomainId,
		selectedDatabaseId,
		selectedSchemaId,
		selectedTableId,
	]);

	return (
		<section className="surface p-6">
			<h2 className="font-display text-3xl text-blue-950">SQL Column Grid</h2>
			<p className="mt-1 text-sm text-blue-900/75">
				View onboarded SQL columns filtered by Domain, Sub Domain, database, schema, and table.
			</p>

			<div className="mt-4 grid max-w-4xl gap-3 md:grid-cols-2">
				<select
					className="select-field w-full"
					disabled={isLoadingHierarchy}
					onChange={(event) => setSelectedDomainId(event.target.value)}
					value={selectedDomainId}
				>
					<option value="">All Domains</option>
					{domains.map((domain) => (
						<option key={domain.id} value={domain.id}>
							{domain.name}
						</option>
					))}
				</select>

				<select
					className="select-field w-full"
					disabled={isLoadingHierarchy}
					onChange={(event) => setSelectedSubDomainId(event.target.value)}
					value={selectedSubDomainId}
				>
					<option value="">All Sub Domains</option>
					{availableSubDomains.map((subDomain: MetadataExplorerSubDomain) => (
						<option key={subDomain.id} value={subDomain.id}>
							{subDomain.name}
						</option>
					))}
				</select>

				<select
					className="select-field w-full"
					disabled={isLoadingHierarchy}
					onChange={(event) => setSelectedDatabaseId(event.target.value)}
					value={selectedDatabaseId}
				>
					<option value="">All Databases</option>
					{availableDatabases.map((database) => (
						<option key={database.id} value={database.id}>
							{database.name}
						</option>
					))}
				</select>

				<select
					className="select-field w-full"
					disabled={isLoadingHierarchy}
					onChange={(event) => setSelectedSchemaId(event.target.value)}
					value={selectedSchemaId}
				>
					<option value="">All Schemas</option>
					{availableSchemas.map((schema) => (
						<option key={schema.id} value={schema.id}>
							{schema.name}
						</option>
					))}
				</select>

				<select
					className="select-field w-full"
					disabled={isLoadingHierarchy}
					onChange={(event) => setSelectedTableId(event.target.value)}
					value={selectedTableId}
				>
					<option value="">All Tables</option>
					{availableTables.map((table) => (
						<option key={table.id} value={table.id}>
							{table.name}
						</option>
					))}
				</select>

				<button
					className="btn-primary justify-self-start"
					disabled={isLoading || isLoadingHierarchy}
					onClick={() => void loadColumns()}
					type="button"
				>
					{isLoading ? "Loading grid..." : "Refresh Grid"}
				</button>
			</div>

			<p className="mt-3 text-sm text-blue-900/75">
				Rows: {totalCount}
			</p>

			{error ? (
				<pre className="alert-error mt-4 overflow-auto text-xs">
					{error}
				</pre>
			) : null}

			<div className="mt-4 overflow-x-auto rounded-xl border border-blue-200">
				<table className="min-w-full text-left text-xs text-blue-950">
					<thead className="bg-blue-50">
						<tr>
							<th className="px-3 py-2">Domain</th>
							<th className="px-3 py-2">Sub Domain</th>
							<th className="px-3 py-2">Server</th>
							<th className="px-3 py-2">Database</th>
							<th className="px-3 py-2">Schema</th>
							<th className="px-3 py-2">Table</th>
							<th className="px-3 py-2">Column</th>
							<th className="px-3 py-2">Data Type</th>
							<th className="px-3 py-2">Business Description</th>
							<th className="px-3 py-2">LLM Confidence</th>
						</tr>
					</thead>
					<tbody>
						{rows.length === 0 ? (
							<tr>
								<td className="px-3 py-3 text-blue-900/70" colSpan={10}>
									{isLoading ? "Loading rows..." : "No SQL columns found for selected filters."}
								</td>
							</tr>
						) : (
							rows.map((row) => (
								<tr key={row.key} className="border-t border-blue-100 hover:bg-blue-50">
									<td className="px-3 py-2">{row.domain}</td>
									<td className="px-3 py-2">{row.subDomain}</td>
									<td className="px-3 py-2">{row.server}</td>
									<td className="px-3 py-2">{row.database}</td>
									<td className="px-3 py-2">{row.schema}</td>
									<td className="px-3 py-2">{row.table}</td>
									<td className="px-3 py-2 font-medium">{row.column}</td>
									<td className="px-3 py-2">{row.dataType}</td>
									<td className="px-3 py-2 max-w-md">{row.businessDescription}</td>
									<td className="px-3 py-2">{row.llmConfidence}</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</section>
	);
}
