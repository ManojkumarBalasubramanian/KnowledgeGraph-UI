import type { SQLApprovedFilter, SQLReviewQueuePanelProps } from "./types";

export default function SQLReviewQueuePanel({
	approvedFilter,
	onApprovedFilterChange,
	databaseFilter,
	onDatabaseFilterChange,
	schemaFilter,
	onSchemaFilterChange,
	tableFilter,
	onTableFilterChange,
	queueLimit,
	onQueueLimitChange,
	filteredQueue,
}: SQLReviewQueuePanelProps) {
	return (
		<section className="surface space-y-4 p-6">
			<h3 className="font-display text-xl text-blue-950">Description Monitoring Queue</h3>
			<p className="text-sm text-blue-900/80">
				Read-only monitoring view for SQL column descriptions generated during onboarding.
			</p>

			<div className="flex flex-wrap items-end gap-3">
				<div className="min-w-40 flex-1">
					<label className="mb-1 block text-xs uppercase tracking-wide text-blue-900/80">
						Approved
					</label>
					<select
						className="select-field"
						value={approvedFilter}
						onChange={(event) =>
							onApprovedFilterChange(event.target.value as SQLApprovedFilter)
						}
					>
						<option value="No">No</option>
						<option value="Yes">Yes</option>
						<option value="">All</option>
					</select>
				</div>
				<div className="min-w-40 flex-1">
					<label className="mb-1 block text-xs uppercase tracking-wide text-blue-900/80">
						Database
					</label>
					<input
						className="input-field"
						placeholder="SalesDB"
						value={databaseFilter}
						onChange={(event) => onDatabaseFilterChange(event.target.value)}
					/>
				</div>
				<div className="min-w-40 flex-1">
					<label className="mb-1 block text-xs uppercase tracking-wide text-blue-900/80">
						Schema
					</label>
					<input
						className="input-field"
						placeholder="dbo"
						value={schemaFilter}
						onChange={(event) => onSchemaFilterChange(event.target.value)}
					/>
				</div>
				<div className="min-w-40 flex-1">
					<label className="mb-1 block text-xs uppercase tracking-wide text-blue-900/80">
						Table
					</label>
					<input
						className="input-field"
						placeholder="Customer"
						value={tableFilter}
						onChange={(event) => onTableFilterChange(event.target.value)}
					/>
				</div>
				<div className="w-28">
					<label className="mb-1 block text-xs uppercase tracking-wide text-blue-900/80">
						Limit
					</label>
					<input
						className="input-field"
						inputMode="numeric"
						value={queueLimit}
						onChange={(event) => onQueueLimitChange(event.target.value)}
					/>
				</div>
			</div>

			<div className="overflow-x-auto rounded-xl border border-blue-200">
				<table className="min-w-full text-left text-xs text-blue-950">
					<thead className="bg-blue-50">
						<tr>
							<th className="px-3 py-2">Column</th>
							<th className="px-3 py-2">Draft Description</th>
							<th className="px-3 py-2">Confidence</th>
							<th className="px-3 py-2">Prompt Version</th>
							<th className="px-3 py-2">Updated</th>
						</tr>
					</thead>
					<tbody>
						{filteredQueue.length === 0 ? (
							<tr>
								<td className="px-3 py-3 text-blue-900/70" colSpan={5}>
									No description records loaded.
								</td>
							</tr>
						) : (
							filteredQueue.map((item) => {
								return (
									<tr
										key={`${item.server_name}|${item.database_name}|${item.schema_name}|${item.table_name}|${item.column_name}`}
										className="hover:bg-blue-50"
									>
										<td className="px-3 py-2">
											<div className="font-medium">
												{item.database_name}.{item.schema_name}.{item.table_name}.
												{item.column_name}
											</div>
											<p className="text-[11px] text-blue-900/70">{item.data_type || "unknown type"}</p>
										</td>
										<td className="max-w-lg px-3 py-2">
											<div className="line-clamp-3">{item.draft_description || "-"}</div>
										</td>
										<td className="px-3 py-2">
											{typeof item.llm_confidence === "number"
												? item.llm_confidence.toFixed(2)
												: "-"}
										</td>
										<td className="px-3 py-2">{item.prompt_version || "-"}</td>
										<td className="px-3 py-2">{item.updated_at || "-"}</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>
		</section>
	);
}
