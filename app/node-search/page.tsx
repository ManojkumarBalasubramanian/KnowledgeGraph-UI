"use client";

import { useEffect, useMemo, useState } from "react";
import { formatAPIError } from "@/services/api";
import { queryGraph } from "@/services/graphService";

type NodeSearchTab = "sql" | "cosmos";

interface SQLRow {
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

interface CosmosRow {
	key: string;
	domain: string;
	subDomain: string;
	database: string;
	collection: string;
	fieldPath: string;
	inferredType: string;
	nullable: string;
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

const matchesExactText = (value: string, query: string): boolean =>
	!query.trim() || value.trim().toLowerCase() === query.trim().toLowerCase();

const escapeCsvValue = (value: string): string => {
	const normalized = value.replace(/\r?\n|\r/g, " ");
	if (/[",]/.test(normalized)) {
		return `"${normalized.replace(/"/g, '""')}"`;
	}
	return normalized;
};

export default function NodeSearchPage() {
	const [activeTab, setActiveTab] = useState<NodeSearchTab>("sql");
	const [sqlRows, setSqlRows] = useState<SQLRow[]>([]);
	const [cosmosRows, setCosmosRows] = useState<CosmosRow[]>([]);
	const [sqlPage, setSqlPage] = useState(1);
	const [cosmosPage, setCosmosPage] = useState(1);
	const [sqlPageSize, setSqlPageSize] = useState(25);
	const [cosmosPageSize, setCosmosPageSize] = useState(25);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const [sqlFilters, setSqlFilters] = useState<Record<string, string>>({
		domain: "",
		subDomain: "",
		server: "",
		database: "",
		schema: "",
		table: "",
		column: "",
		dataType: "",
		businessDescription: "",
		llmConfidence: "",
	});

	const [cosmosFilters, setCosmosFilters] = useState<Record<string, string>>({
		domain: "",
		subDomain: "",
		database: "",
		collection: "",
		fieldPath: "",
		inferredType: "",
		nullable: "",
		businessDescription: "",
		llmConfidence: "",
	});

	const resetSqlFilters = () => {
		setSqlFilters({
			domain: "",
			subDomain: "",
			server: "",
			database: "",
			schema: "",
			table: "",
			column: "",
			dataType: "",
			businessDescription: "",
			llmConfidence: "",
		});
	};

	const resetCosmosFilters = () => {
		setCosmosFilters({
			domain: "",
			subDomain: "",
			database: "",
			collection: "",
			fieldPath: "",
			inferredType: "",
			nullable: "",
			businessDescription: "",
			llmConfidence: "",
		});
	};

	const loadSqlRows = async () => {
		const response = await queryGraph({
			query: `
				MATCH (db:Database)-[:HAS_SCHEMA]->(s:Schema)-[:HAS_TABLE]->(t:Table)-[:HAS_COLUMN]->(c:Column)
				OPTIONAL MATCH (sd:SubDomain)-[:USES_SQLSERVER|USES_DATABASE|USES_SQLDB|USES_DB]-(db)
				OPTIONAL MATCH (d:Domain)-[:HAS_SUBDOMAIN|HAS_SUB_DOMAIN|BELONGS_TO_DOMAIN]-(sd)
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
		});

		const mappedRows: SQLRow[] = response.results.map((item, index) => ({
			key: `${toStringValue(item.rowKey, "sql-row")}|${index}`,
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

		setSqlRows(mappedRows);
	};

	const loadCosmosRows = async () => {
		const response = await queryGraph({
			query: `
				MATCH (db:CosmosDatabase)-[:HAS_COLLECTION]->(col:Collection)-[:HAS_FIELD]->(f:Field)
				OPTIONAL MATCH (sd:SubDomain)-[:USES_COSMOSDB]-(db)
				OPTIONAL MATCH (d:Domain)-[:HAS_SUBDOMAIN|HAS_SUB_DOMAIN|BELONGS_TO_DOMAIN]-(sd)
				RETURN
					coalesce(d.name, 'Unassigned') AS domain,
					coalesce(sd.name, 'Unassigned') AS subDomain,
					coalesce(db.name, db.id, 'Unknown') AS database,
					coalesce(col.name, col.id, 'Unknown') AS collection,
					coalesce(f.name, f.field_path, f.path, f.id, 'Unknown') AS fieldPath,
					coalesce(f.inferred_type, f.data_type, f.type, '-') AS inferredType,
					coalesce(toString(f.nullable), '-') AS nullable,
					coalesce(toString(f.sample_count), '-') AS sampleCount,
					coalesce(toString(f.present_count), '-') AS presentCount,
					coalesce(f.business_description, '-') AS businessDescription,
					f.llm_confidence AS llmConfidence,
					coalesce(col.id, col.name, '') + '|' + coalesce(f.id, f.name, '') AS rowKey
				ORDER BY domain, subDomain, database, collection, fieldPath
			`,
		});

		const mappedRows: CosmosRow[] = response.results.map((item, index) => ({
			key: `${toStringValue(item.rowKey, "cosmos-row")}|${index}`,
			domain: toStringValue(item.domain),
			subDomain: toStringValue(item.subDomain),
			database: toStringValue(item.database),
			collection: toStringValue(item.collection),
			fieldPath: toStringValue(item.fieldPath),
			inferredType: toStringValue(item.inferredType),
			nullable: toStringValue(item.nullable),
			businessDescription: toStringValue(item.businessDescription),
			llmConfidence: toNumberString(item.llmConfidence),
		}));

		setCosmosRows(mappedRows);
	};

	const loadRows = async () => {
		setIsLoading(true);
		setError("");
		try {
			if (activeTab === "sql") {
				await loadSqlRows();
			} else {
				await loadCosmosRows();
			}
		} catch (err) {
			setError(formatAPIError(err, "Failed to load records."));
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		void loadRows();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeTab]);

	const filteredSqlRows = useMemo(
		() =>
			sqlRows.filter((row) =>
				matchesExactText(row.domain, sqlFilters.domain) &&
				matchesExactText(row.subDomain, sqlFilters.subDomain) &&
				matchesExactText(row.server, sqlFilters.server) &&
				matchesExactText(row.database, sqlFilters.database) &&
				matchesExactText(row.schema, sqlFilters.schema) &&
				matchesExactText(row.table, sqlFilters.table) &&
				matchesExactText(row.column, sqlFilters.column) &&
				matchesExactText(row.dataType, sqlFilters.dataType) &&
				matchesExactText(row.businessDescription, sqlFilters.businessDescription) &&
				matchesExactText(row.llmConfidence, sqlFilters.llmConfidence),
			),
		[sqlFilters, sqlRows],
	);

	const filteredCosmosRows = useMemo(
		() =>
			cosmosRows.filter((row) =>
				matchesExactText(row.domain, cosmosFilters.domain) &&
				matchesExactText(row.subDomain, cosmosFilters.subDomain) &&
				matchesExactText(row.database, cosmosFilters.database) &&
				matchesExactText(row.collection, cosmosFilters.collection) &&
				matchesExactText(row.fieldPath, cosmosFilters.fieldPath) &&
				matchesExactText(row.inferredType, cosmosFilters.inferredType) &&
				matchesExactText(row.nullable, cosmosFilters.nullable) &&
				matchesExactText(row.businessDescription, cosmosFilters.businessDescription) &&
				matchesExactText(row.llmConfidence, cosmosFilters.llmConfidence),
			),
		[cosmosFilters, cosmosRows],
	);

	const sqlTotalPages = useMemo(
		() => Math.max(1, Math.ceil(filteredSqlRows.length / sqlPageSize)),
		[filteredSqlRows.length, sqlPageSize],
	);

	const cosmosTotalPages = useMemo(
		() => Math.max(1, Math.ceil(filteredCosmosRows.length / cosmosPageSize)),
		[cosmosPageSize, filteredCosmosRows.length],
	);

	useEffect(() => {
		setSqlPage(1);
	}, [sqlFilters, sqlPageSize]);

	useEffect(() => {
		setCosmosPage(1);
	}, [cosmosFilters, cosmosPageSize]);

	useEffect(() => {
		if (sqlPage > sqlTotalPages) {
			setSqlPage(sqlTotalPages);
		}
	}, [sqlPage, sqlTotalPages]);

	useEffect(() => {
		if (cosmosPage > cosmosTotalPages) {
			setCosmosPage(cosmosTotalPages);
		}
	}, [cosmosPage, cosmosTotalPages]);

	const pagedSqlRows = useMemo(() => {
		const start = (sqlPage - 1) * sqlPageSize;
		return filteredSqlRows.slice(start, start + sqlPageSize);
	}, [filteredSqlRows, sqlPage, sqlPageSize]);

	const pagedCosmosRows = useMemo(() => {
		const start = (cosmosPage - 1) * cosmosPageSize;
		return filteredCosmosRows.slice(start, start + cosmosPageSize);
	}, [cosmosPage, cosmosPageSize, filteredCosmosRows]);

	const downloadCsv = () => {
		if (activeTab === "sql") {
			if (filteredSqlRows.length === 0) {
				return;
			}

			const headers = [
				"Domain",
				"Sub Domain",
				"Server",
				"Database",
				"Schema",
				"Table",
				"Column",
				"Data Type",
				"Business Description",
				"LLM Confidence",
			];

			const rows = filteredSqlRows.map((row) => [
				row.domain,
				row.subDomain,
				row.server,
				row.database,
				row.schema,
				row.table,
				row.column,
				row.dataType,
				row.businessDescription,
				row.llmConfidence,
			]);

			const csvContent = [
				headers.map(escapeCsvValue).join(","),
				...rows.map((row) => row.map(escapeCsvValue).join(",")),
			].join("\n");

			const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = "sql_metadata_filtered.csv";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
			return;
		}

		if (filteredCosmosRows.length === 0) {
			return;
		}

		const headers = [
			"Domain",
			"Sub Domain",
			"Cosmos Database",
			"Collection",
			"Field Path",
			"Inferred Type",
			"Nullable",
			"Business Description",
			"LLM Confidence",
		];

		const rows = filteredCosmosRows.map((row) => [
			row.domain,
			row.subDomain,
			row.database,
			row.collection,
			row.fieldPath,
			row.inferredType,
			row.nullable,
			row.businessDescription,
			row.llmConfidence,
		]);

		const csvContent = [
			headers.map(escapeCsvValue).join(","),
			...rows.map((row) => row.map(escapeCsvValue).join(",")),
		].join("\n");

		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = "cosmos_metadata_filtered.csv";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	return (
		<section className="surface p-6">
			<h2 className="font-display text-3xl text-blue-950">Node Search</h2>
			<p className="mt-1 text-sm text-blue-900/75">
				Showing all records. Use table filters to narrow results.
			</p>

			<div className="mt-4 flex flex-wrap items-center gap-2">
				<button
					className={activeTab === "sql" ? "btn-primary" : "btn-secondary"}
					onClick={() => setActiveTab("sql")}
					type="button"
				>
					SQL Server
				</button>
				<button
					className={activeTab === "cosmos" ? "btn-primary" : "btn-secondary"}
					onClick={() => setActiveTab("cosmos")}
					type="button"
				>
					Cosmos
				</button>
				<button className="btn-secondary" disabled={isLoading} onClick={() => void loadRows()} type="button">
					{isLoading ? "Refreshing..." : "Refresh"}
				</button>
				<button
					className="btn-secondary"
					onClick={activeTab === "sql" ? resetSqlFilters : resetCosmosFilters}
					type="button"
				>
					Clear All Filters
				</button>
				<button
					className="btn-secondary"
					disabled={activeTab === "sql" ? filteredSqlRows.length === 0 : filteredCosmosRows.length === 0}
					onClick={downloadCsv}
					type="button"
				>
					Download CSV
				</button>
			</div>

			<p className="mt-3 text-sm text-blue-900/75">
				Rows: {activeTab === "sql" ? filteredSqlRows.length : filteredCosmosRows.length}
			</p>

			<div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-blue-900">
				<label className="flex items-center gap-2">
					<span>Page size</span>
					<select
						className="select-field"
						value={activeTab === "sql" ? sqlPageSize : cosmosPageSize}
						onChange={(event) => {
							const nextSize = Number(event.target.value);
							if (activeTab === "sql") {
								setSqlPageSize(nextSize);
							} else {
								setCosmosPageSize(nextSize);
							}
						}}
					>
						<option value={10}>10</option>
						<option value={25}>25</option>
						<option value={50}>50</option>
						<option value={100}>100</option>
					</select>
				</label>

				<button
					className="btn-secondary"
					disabled={activeTab === "sql" ? sqlPage <= 1 : cosmosPage <= 1}
					onClick={() => {
						if (activeTab === "sql") {
							setSqlPage((prev) => Math.max(1, prev - 1));
						} else {
							setCosmosPage((prev) => Math.max(1, prev - 1));
						}
					}}
					type="button"
				>
					Previous
				</button>

				<span>
					Page {activeTab === "sql" ? sqlPage : cosmosPage} of {activeTab === "sql" ? sqlTotalPages : cosmosTotalPages}
				</span>

				<button
					className="btn-secondary"
					disabled={activeTab === "sql" ? sqlPage >= sqlTotalPages : cosmosPage >= cosmosTotalPages}
					onClick={() => {
						if (activeTab === "sql") {
							setSqlPage((prev) => Math.min(sqlTotalPages, prev + 1));
						} else {
							setCosmosPage((prev) => Math.min(cosmosTotalPages, prev + 1));
						}
					}}
					type="button"
				>
					Next
				</button>
			</div>

			{error ? <pre className="alert-error mt-4 overflow-auto text-xs">{error}</pre> : null}

			<div className="mt-4 overflow-x-auto rounded-xl border border-blue-200">
				{activeTab === "sql" ? (
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
							<tr>
								<td className="px-2 py-2"><input className="input-field" value={sqlFilters.domain} onChange={(event) => setSqlFilters((prev) => ({ ...prev, domain: event.target.value }))} placeholder="Filter" /></td>
								<td className="px-2 py-2"><input className="input-field" value={sqlFilters.subDomain} onChange={(event) => setSqlFilters((prev) => ({ ...prev, subDomain: event.target.value }))} placeholder="Filter" /></td>
								<td className="px-2 py-2"><input className="input-field" value={sqlFilters.server} onChange={(event) => setSqlFilters((prev) => ({ ...prev, server: event.target.value }))} placeholder="Filter" /></td>
								<td className="px-2 py-2"><input className="input-field" value={sqlFilters.database} onChange={(event) => setSqlFilters((prev) => ({ ...prev, database: event.target.value }))} placeholder="Filter" /></td>
								<td className="px-2 py-2"><input className="input-field" value={sqlFilters.schema} onChange={(event) => setSqlFilters((prev) => ({ ...prev, schema: event.target.value }))} placeholder="Filter" /></td>
								<td className="px-2 py-2"><input className="input-field" value={sqlFilters.table} onChange={(event) => setSqlFilters((prev) => ({ ...prev, table: event.target.value }))} placeholder="Filter" /></td>
								<td className="px-2 py-2"><input className="input-field" value={sqlFilters.column} onChange={(event) => setSqlFilters((prev) => ({ ...prev, column: event.target.value }))} placeholder="Filter" /></td>
								<td className="px-2 py-2"><input className="input-field" value={sqlFilters.dataType} onChange={(event) => setSqlFilters((prev) => ({ ...prev, dataType: event.target.value }))} placeholder="Filter" /></td>
								<td className="px-2 py-2"><input className="input-field" value={sqlFilters.businessDescription} onChange={(event) => setSqlFilters((prev) => ({ ...prev, businessDescription: event.target.value }))} placeholder="Filter" /></td>
								<td className="px-2 py-2"><input className="input-field" value={sqlFilters.llmConfidence} onChange={(event) => setSqlFilters((prev) => ({ ...prev, llmConfidence: event.target.value }))} placeholder="Filter" /></td>
							</tr>
						</thead>
						<tbody>
							{filteredSqlRows.length === 0 ? (
								<tr>
									<td className="px-3 py-3 text-blue-900/70" colSpan={10}>
										{isLoading ? "Loading rows..." : "No SQL records found."}
									</td>
								</tr>
							) : (
								pagedSqlRows.map((row) => (
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
				) : (
					<table className="min-w-full text-left text-xs text-blue-950">
						<thead className="bg-blue-50">
							<tr>
								<th className="px-3 py-2">Domain</th>
								<th className="px-3 py-2">Sub Domain</th>
								<th className="px-3 py-2">Cosmos Database</th>
								<th className="px-3 py-2">Collection</th>
								<th className="px-3 py-2">Field Path</th>
								<th className="px-3 py-2">Inferred Type</th>
								<th className="px-3 py-2">Nullable</th>
								<th className="px-3 py-2">Business Description</th>
								<th className="px-3 py-2">LLM Confidence</th>
							</tr>
							<tr>
								<td className="px-2 py-2"><input className="input-field" value={cosmosFilters.domain} onChange={(event) => setCosmosFilters((prev) => ({ ...prev, domain: event.target.value }))} placeholder="Filter" /></td>
								<td className="px-2 py-2"><input className="input-field" value={cosmosFilters.subDomain} onChange={(event) => setCosmosFilters((prev) => ({ ...prev, subDomain: event.target.value }))} placeholder="Filter" /></td>
								<td className="px-2 py-2"><input className="input-field" value={cosmosFilters.database} onChange={(event) => setCosmosFilters((prev) => ({ ...prev, database: event.target.value }))} placeholder="Filter" /></td>
								<td className="px-2 py-2"><input className="input-field" value={cosmosFilters.collection} onChange={(event) => setCosmosFilters((prev) => ({ ...prev, collection: event.target.value }))} placeholder="Filter" /></td>
								<td className="px-2 py-2"><input className="input-field" value={cosmosFilters.fieldPath} onChange={(event) => setCosmosFilters((prev) => ({ ...prev, fieldPath: event.target.value }))} placeholder="Filter" /></td>
								<td className="px-2 py-2"><input className="input-field" value={cosmosFilters.inferredType} onChange={(event) => setCosmosFilters((prev) => ({ ...prev, inferredType: event.target.value }))} placeholder="Filter" /></td>
								<td className="px-2 py-2"><input className="input-field" value={cosmosFilters.nullable} onChange={(event) => setCosmosFilters((prev) => ({ ...prev, nullable: event.target.value }))} placeholder="Filter" /></td>
								<td className="px-2 py-2"><input className="input-field" value={cosmosFilters.businessDescription} onChange={(event) => setCosmosFilters((prev) => ({ ...prev, businessDescription: event.target.value }))} placeholder="Filter" /></td>
								<td className="px-2 py-2"><input className="input-field" value={cosmosFilters.llmConfidence} onChange={(event) => setCosmosFilters((prev) => ({ ...prev, llmConfidence: event.target.value }))} placeholder="Filter" /></td>
							</tr>
						</thead>
						<tbody>
							{filteredCosmosRows.length === 0 ? (
								<tr>
									<td className="px-3 py-3 text-blue-900/70" colSpan={11}>
										{isLoading ? "Loading rows..." : "No Cosmos records found."}
									</td>
								</tr>
							) : (
								pagedCosmosRows.map((row) => (
									<tr key={row.key} className="border-t border-blue-100 hover:bg-blue-50">
										<td className="px-3 py-2">{row.domain}</td>
										<td className="px-3 py-2">{row.subDomain}</td>
										<td className="px-3 py-2">{row.database}</td>
										<td className="px-3 py-2">{row.collection}</td>
										<td className="px-3 py-2 font-medium">{row.fieldPath}</td>
										<td className="px-3 py-2">{row.inferredType}</td>
										<td className="px-3 py-2">{row.nullable}</td>
										<td className="px-3 py-2 max-w-md">{row.businessDescription}</td>
										<td className="px-3 py-2">{row.llmConfidence}</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				)}
			</div>
		</section>
	);
}
