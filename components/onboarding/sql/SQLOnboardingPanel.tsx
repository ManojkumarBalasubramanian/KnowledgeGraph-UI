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
		</section>
	);
}
