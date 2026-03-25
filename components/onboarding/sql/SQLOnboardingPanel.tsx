import DomainSubDomainFields from "../shared/DomainSubDomainFields";
import type { SQLOnboardingPanelProps } from "./types";

export default function SQLOnboardingPanel({
	domains,
	selectedDomainId,
	onSelectedDomainIdChange,
	selectedSubDomainId,
	onSelectedSubDomainIdChange,
	subDomains,
	isLoadingHierarchy,
	connectionString,
	onConnectionStringChange,
	isOnboarding,
	isLoadingCatalog,
	catalog,
	selectedSchema,
	onSelectedSchemaChange,
	selectedTable,
	onSelectedTableChange,
	deltaOnly,
	onDeltaOnlyChange,
	advancedPerformanceEnabled,
	onAdvancedPerformanceEnabledChange,
	parallelEnabledSelection,
	onParallelEnabledSelectionChange,
	maxWorkersInput,
	onMaxWorkersInputChange,
	rollupBatchEnabledSelection,
	onRollupBatchEnabledSelectionChange,
	optimizationMessage,
	onSubmit,
	onLoadCatalog,
}: SQLOnboardingPanelProps) {
	const selectedSchemaTables =
		catalog.find((item) => item.schema === selectedSchema)?.tables ?? [];

	return (
		<section className="surface space-y-4 p-6">
			<h2 className="font-display text-2xl text-blue-950">SQL Server Onboarding</h2>

			<DomainSubDomainFields
				domains={domains}
				subDomains={subDomains}
				selectedDomainId={selectedDomainId}
				onSelectedDomainIdChange={onSelectedDomainIdChange}
				selectedSubDomainId={selectedSubDomainId}
				onSelectedSubDomainIdChange={onSelectedSubDomainIdChange}
				isLoadingHierarchy={isLoadingHierarchy}
			/>

			<textarea
				className="textarea-field min-h-32"
				placeholder="DRIVER={ODBC Driver 18 for SQL Server};SERVER=...;DATABASE=...;UID=...;PWD=...;Encrypt=yes;"
				value={connectionString}
				onChange={(event) => onConnectionStringChange(event.target.value)}
			/>

			<div className="flex flex-wrap items-center gap-3">
				<button
					className="btn-secondary"
					disabled={isLoadingCatalog || !connectionString.trim()}
					onClick={() => void onLoadCatalog()}
					type="button"
				>
					{isLoadingCatalog ? "Loading schema/table..." : "Load Schema/Table"}
				</button>
			</div>

			<div className="grid gap-3 md:grid-cols-2">
				<label className="space-y-1 text-sm text-blue-900">
					<span className="font-medium">Schema</span>
					<select
						className="select-field"
						value={selectedSchema}
						onChange={(event) => onSelectedSchemaChange(event.target.value)}
					>
						<option value="">Full database (all schemas/tables)</option>
						{catalog.map((schemaItem) => (
							<option key={schemaItem.schema} value={schemaItem.schema}>
								{schemaItem.schema}
							</option>
						))}
					</select>
				</label>

				<label className="space-y-1 text-sm text-blue-900">
					<span className="font-medium">Table</span>
					<select
						className="select-field"
						disabled={!selectedSchema}
						value={selectedTable}
						onChange={(event) => onSelectedTableChange(event.target.value)}
					>
						<option value="">All tables in selected schema</option>
						{selectedSchemaTables.map((tableName) => (
							<option key={tableName} value={tableName}>
								{tableName}
							</option>
						))}
					</select>
				</label>
			</div>

			<label className="flex items-start gap-2 text-sm text-blue-900">
				<input
					checked={deltaOnly}
					className="mt-1"
					onChange={(event) => onDeltaOnlyChange(event.target.checked)}
					type="checkbox"
				/>
				<span>
					<span className="block font-medium">Delta only (skip already onboarded columns)</span>
					<span className="text-xs text-blue-900/75">
						Only new columns are added to Neo4j; existing columns are skipped.
					</span>
				</span>
			</label>

			<details className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
				<summary className="cursor-pointer select-none font-medium text-blue-950">
					Advanced Performance
				</summary>
				<div className="mt-3 space-y-3">
					<label className="flex items-start gap-2 text-sm text-blue-900">
						<input
							checked={advancedPerformanceEnabled}
							className="mt-1"
							onChange={(event) =>
								onAdvancedPerformanceEnabledChange(event.target.checked)
							}
							type="checkbox"
						/>
						<span>
							<span className="block font-medium">Enable request-level performance overrides</span>
							<span className="text-xs text-blue-900/75">
								If disabled, the API uses backend defaults and no optimization fields are sent.
							</span>
						</span>
					</label>

					<div className="grid gap-3 md:grid-cols-3">
						<label className="space-y-1 text-sm text-blue-900">
							<span className="font-medium">Parallel processing</span>
							<select
								className="select-field"
								disabled={!advancedPerformanceEnabled}
								value={parallelEnabledSelection}
								onChange={(event) =>
									onParallelEnabledSelectionChange(
										event.target.value as "" | "true" | "false",
									)
								}
							>
								<option value="">Use backend default</option>
								<option value="true">Enabled</option>
								<option value="false">Disabled</option>
							</select>
							<p className="text-xs text-blue-900/75">
								Parallel increases throughput for large schemas.
							</p>
						</label>

						<label className="space-y-1 text-sm text-blue-900">
							<span className="font-medium">Max workers</span>
							<input
								className="input-field"
								disabled={!advancedPerformanceEnabled}
								inputMode="numeric"
								max={32}
								min={1}
								onChange={(event) => onMaxWorkersInputChange(event.target.value)}
								placeholder="Use backend default"
								value={maxWorkersInput}
							/>
							<p className="text-xs text-blue-900/75">
								Higher max workers can increase API/database pressure.
							</p>
						</label>

						<label className="space-y-1 text-sm text-blue-900">
							<span className="font-medium">Batch rollup refresh</span>
							<select
								className="select-field"
								disabled={!advancedPerformanceEnabled}
								value={rollupBatchEnabledSelection}
								onChange={(event) =>
									onRollupBatchEnabledSelectionChange(
										event.target.value as "" | "true" | "false",
									)
								}
							>
								<option value="">Use backend default</option>
								<option value="true">Enabled</option>
								<option value="false">Disabled</option>
							</select>
							<p className="text-xs text-blue-900/75">
								Batch rollup reduces repeated parent-level recompute work.
							</p>
						</label>
					</div>
				</div>
			</details>

			<div className="flex flex-wrap items-center gap-3">
				<button
					className="btn-primary"
					disabled={isOnboarding || !connectionString.trim() || !selectedSubDomainId}
					onClick={() => void onSubmit()}
					type="button"
				>
					{isOnboarding ? "Running..." : "Start SQL Onboarding"}
				</button>
			</div>

			{optimizationMessage ? (
				<div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
					<p className="font-semibold">Effective runtime optimization</p>
					<p className="mt-1">{optimizationMessage}</p>
				</div>
			) : null}
		</section>
	);
}
