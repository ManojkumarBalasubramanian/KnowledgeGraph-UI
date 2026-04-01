"use client";

import { useEffect, useMemo, useState } from "react";
import { APIRequestError } from "@/services/api";
import {
	bulkUpdateMetadataColumnDescriptions,
	getMetadataAssetDetail,
	getMetadataExplorerHierarchy,
	processMetadataApprovedDescriptions,
} from "@/services/graphService";
import type {
	MetadataColumnDetail,
	MetadataExplorerAsset,
	MetadataExplorerHierarchyResponse,
	MetadataExplorerSchema,
	MetadataStoreType,
} from "@/types/api";

const STORE_TYPES: MetadataStoreType[] = ["Database", "CosmosDatabase"];

const inferSchemaNameFromAsset = (asset: MetadataExplorerAsset): string => {
	const id = asset.id || "";
	const name = asset.name || "";

	if (asset.asset_type === "Collection") {
		return "Default";
	}

	const idParts = id.split(".");
	if (idParts.length > 1 && idParts[0].trim()) {
		return idParts[0].trim();
	}

	if (name.includes(".")) {
		const nameParts = name.split(".");
		if (nameParts[0].trim()) {
			return nameParts[0].trim();
		}
	}

	return "Default";
};

const deriveSchemasFromLegacyAssets = (assets: MetadataExplorerAsset[]): MetadataExplorerSchema[] => {
	const schemaMap = new Map<string, MetadataExplorerSchema>();

	assets.forEach((asset) => {
		const schemaName = inferSchemaNameFromAsset(asset);
		if (!schemaMap.has(schemaName)) {
			schemaMap.set(schemaName, {
				id: schemaName,
				name: schemaName,
				assets: [],
			});
		}

		schemaMap.get(schemaName)?.assets.push(asset);
	});

	return Array.from(schemaMap.values()).sort((a, b) => a.name.localeCompare(b.name));
};

export default function GraphPage() {
	const [hierarchy, setHierarchy] = useState<MetadataExplorerHierarchyResponse | null>(null);
	const [domainId, setDomainId] = useState("");
	const [subDomainId, setSubDomainId] = useState("");
	const [storeType, setStoreType] = useState<MetadataStoreType>("Database");
	const [storeId, setStoreId] = useState("");
	const [schemaId, setSchemaId] = useState("");
	const [assetId, setAssetId] = useState("");

	const [columns, setColumns] = useState<MetadataColumnDetail[]>([]);
	const [columnNameFilter, setColumnNameFilter] = useState("");
	const [columnTypeFilter, setColumnTypeFilter] = useState("");
	const [columnDescriptionFilter, setColumnDescriptionFilter] = useState("");
	const [columnDescriptionDrafts, setColumnDescriptionDrafts] = useState<Record<string, string>>({});
	const [stewardName, setStewardName] = useState("");

	const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(false);
	const [isLoadingDetail, setIsLoadingDetail] = useState(false);
	const [isSavingDescription, setIsSavingDescription] = useState(false);
	const [isProcessingApprovals, setIsProcessingApprovals] = useState(false);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");
	const [debugInfo, setDebugInfo] = useState<{
		operation: string;
		endpoint: string;
		statusCode?: number;
	} | null>(null);

	useEffect(() => {
		const loadHierarchy = async () => {
			setIsLoadingHierarchy(true);
			setMessage("");
			setError("");
			setDebugInfo({
				operation: "load-hierarchy",
				endpoint: "/api/graph/metadata-explorer/hierarchy",
			});
			try {
				const data = await getMetadataExplorerHierarchy();
				setHierarchy(data);
			} catch (err) {
				if (err instanceof APIRequestError) {
					setDebugInfo((previous) =>
						previous
							? { ...previous, statusCode: err.statusCode }
							: {
								operation: "load-hierarchy",
								endpoint: "/api/graph/metadata-explorer/hierarchy",
								statusCode: err.statusCode,
							},
					);
					setError(
						typeof err.detail === "string"
							? err.detail
							: JSON.stringify(err.detail, null, 2),
					);
				} else {
					setError("Failed to load Data Governance hierarchy.");
				}
			} finally {
				setIsLoadingHierarchy(false);
			}
		};

		void loadHierarchy();
	}, []);

	const selectedDomain = useMemo(
		() => hierarchy?.domains.find((domain) => domain.id === domainId) ?? null,
		[hierarchy, domainId],
	);

	const selectedSubDomain = useMemo(
		() => selectedDomain?.sub_domains.find((subDomain) => subDomain.id === subDomainId) ?? null,
		[selectedDomain, subDomainId],
	);

	const stores = useMemo(
		() => selectedSubDomain?.stores.filter((store) => store.store_type === storeType) ?? [],
		[selectedSubDomain, storeType],
	);

	const selectedStore = useMemo(
		() => stores.find((store) => store.id === storeId) ?? null,
		[stores, storeId],
	);

	const schemas = useMemo(
		() => {
			if (!selectedStore) {
				return [];
			}

			if (selectedStore.schemas && selectedStore.schemas.length > 0) {
				return selectedStore.schemas;
			}

			const legacyAssets =
				(selectedStore as unknown as { assets?: MetadataExplorerAsset[] }).assets ?? [];

			if (legacyAssets.length > 0) {
				return deriveSchemasFromLegacyAssets(legacyAssets);
			}

			return [];
		},
		[selectedStore],
	);

	const selectedSchema = useMemo<MetadataExplorerSchema | null>(
		() => schemas.find((schema) => schema.id === schemaId) ?? null,
		[schemas, schemaId],
	);

	useEffect(() => {
		if (!schemaId && schemas.length > 0) {
			setSchemaId(schemas[0].id);
		}
	}, [schemaId, schemas]);

	const assets = useMemo(
		() => {
			const schemaAssets = selectedSchema?.assets ?? [];
			const tableAssets = schemaAssets.filter((asset) => asset.asset_type === "Table");
			return tableAssets.length > 0 ? tableAssets : schemaAssets;
		},
		[selectedSchema],
	);

	const selectedAsset = useMemo<MetadataExplorerAsset | null>(
		() => assets.find((asset) => asset.id === assetId) ?? null,
		[assets, assetId],
	);

	const metadataEntityLabel = selectedAsset?.asset_type === "Collection" ? "Field" : "Column";
	const metadataEntityLabelLower = metadataEntityLabel.toLowerCase();

	const assetSelectorLabel = useMemo(() => {
		if (assets.length > 0 && assets.every((asset) => asset.asset_type === "Table")) {
			return "Table";
		}

		const assetTypes = new Set(assets.map((asset) => asset.asset_type));
		if (assetTypes.size === 1 && assetTypes.has("Table")) {
			return "Table";
		}
		if (assetTypes.size === 1 && assetTypes.has("Collection")) {
			return "Collection";
		}
		return "Asset";
	}, [assets]);

	useEffect(() => {
		setSubDomainId("");
		setStoreId("");
		setSchemaId("");
		setAssetId("");
		setColumns([]);
		setColumnNameFilter("");
		setColumnTypeFilter("");
		setColumnDescriptionFilter("");
		setColumnDescriptionDrafts({});
	}, [domainId]);

	useEffect(() => {
		setStoreId("");
		setSchemaId("");
		setAssetId("");
		setColumns([]);
		setColumnNameFilter("");
		setColumnTypeFilter("");
		setColumnDescriptionFilter("");
		setColumnDescriptionDrafts({});
	}, [subDomainId, storeType]);

	useEffect(() => {
		setSchemaId("");
		setAssetId("");
		setColumns([]);
		setColumnNameFilter("");
		setColumnTypeFilter("");
		setColumnDescriptionFilter("");
		setColumnDescriptionDrafts({});
	}, [storeId]);

	useEffect(() => {
		setAssetId("");
		setColumns([]);
		setColumnNameFilter("");
		setColumnTypeFilter("");
		setColumnDescriptionFilter("");
		setColumnDescriptionDrafts({});
	}, [schemaId]);

	useEffect(() => {
		if (!selectedAsset?.id) {
			return;
		}

		const loadDetail = async () => {
			setIsLoadingDetail(true);
			setMessage("");
			setError("");
			setDebugInfo({
				operation: "load-asset-detail",
				endpoint: `/api/graph/metadata-explorer/assets/${encodeURIComponent(selectedAsset.id)}`,
			});
			try {
				const detail = await getMetadataAssetDetail(selectedAsset.id);
				const columnRows = detail.columns ?? [];
				const draftMap = columnRows.reduce<Record<string, string>>((acc, column) => {
					acc[column.column_id] = column.business_description || "";
					return acc;
				}, {});
				setColumns(columnRows);
				setColumnDescriptionDrafts(draftMap);
			} catch (err) {
				if (err instanceof APIRequestError) {
					setDebugInfo((previous) =>
						previous
							? { ...previous, statusCode: err.statusCode }
							: {
								operation: "load-asset-detail",
								endpoint: `/api/graph/metadata-explorer/assets/${encodeURIComponent(selectedAsset.id)}`,
								statusCode: err.statusCode,
							},
					);
					setError(
						typeof err.detail === "string"
							? err.detail
							: JSON.stringify(err.detail, null, 2),
					);
				} else {
					setError("Failed to load data asset details from graph DB.");
				}
			} finally {
				setIsLoadingDetail(false);
			}
		};

		void loadDetail();
	}, [selectedAsset]);

	const saveDescription = async () => {
		if (!selectedAsset?.id) {
			setError(`Select an asset before saving ${metadataEntityLabelLower} descriptions.`);
			return;
		}

		const payloadColumns = columns
			.filter((column) => isColumnEdited(column))
			.map((column) => ({
				column_id: column.column_id,
				business_description: (columnDescriptionDrafts[column.column_id] || "").trim(),
				llm_confidence: 1,
			}));

		if (payloadColumns.length === 0) {
			setError(`No changed ${metadataEntityLabelLower}s available for bulk update.`);
			return;
		}

		setIsSavingDescription(true);
		setError("");
		setMessage("");
		setDebugInfo({
			operation: "bulk-update-descriptions",
			endpoint: `/api/graph/metadata-explorer/assets/${encodeURIComponent(selectedAsset.id)}/columns/business-description/bulk`,
		});
		try {
			const response = await bulkUpdateMetadataColumnDescriptions(selectedAsset.id, {
				columns: payloadColumns,
				steward: stewardName.trim() || undefined,
			});
			setColumns((previous) =>
				previous.map((column) => ({
					...column,
					business_description: columnDescriptionDrafts[column.column_id] || "",
					llm_confidence: isColumnEdited(column) ? 1 : column.llm_confidence,
				})),
			);
			setMessage(response.message || `${metadataEntityLabel} descriptions bulk-updated.`);
		} catch (err) {
			if (err instanceof APIRequestError) {
				setDebugInfo((previous) =>
					previous
						? { ...previous, statusCode: err.statusCode }
						: {
							operation: "bulk-update-descriptions",
							endpoint: `/api/graph/metadata-explorer/assets/${encodeURIComponent(selectedAsset.id)}/columns/business-description/bulk`,
							statusCode: err.statusCode,
						},
				);
				setError(
					typeof err.detail === "string"
						? err.detail
						: JSON.stringify(err.detail, null, 2),
				);
			} else {
				setError(`Failed saving ${metadataEntityLabelLower} descriptions.`);
			}
		} finally {
			setIsSavingDescription(false);
		}
	};

	const processApprovedDescriptions = async () => {
		if (!selectedAsset?.id) {
			setError(`Select an asset before processing approved ${metadataEntityLabelLower} descriptions.`);
			return;
		}

		setIsProcessingApprovals(true);
		setError("");
		setMessage("");
		setDebugInfo({
			operation: "process-approved",
			endpoint: `/api/graph/metadata-explorer/assets/${encodeURIComponent(selectedAsset.id)}/process-approved`,
		});
		try {
			const response = await processMetadataApprovedDescriptions(selectedAsset.id, {
				requested_by: stewardName.trim() || undefined,
			});
			setMessage(response.message || `Approved ${metadataEntityLabelLower} descriptions processing has started.`);
		} catch (err) {
			if (err instanceof APIRequestError) {
				setDebugInfo((previous) =>
					previous
						? { ...previous, statusCode: err.statusCode }
						: {
							operation: "process-approved",
							endpoint: `/api/graph/metadata-explorer/assets/${encodeURIComponent(selectedAsset.id)}/process-approved`,
							statusCode: err.statusCode,
						},
				);
				setError(
					typeof err.detail === "string"
						? err.detail
						: JSON.stringify(err.detail, null, 2),
				);
			} else {
				setError("Failed processing approved descriptions.");
			}
		} finally {
			setIsProcessingApprovals(false);
		}
	};

	const nameQuery = columnNameFilter.trim().toLowerCase();
	const typeQuery = columnTypeFilter.trim().toLowerCase();
	const descriptionQuery = columnDescriptionFilter.trim().toLowerCase();

	const filteredColumns = columns.filter((column) => {
		const name = column.name.toLowerCase();
		const type = (column.data_type || "").toLowerCase();
		const description = (column.business_description || "").toLowerCase();

		if (nameQuery && !name.includes(nameQuery)) {
			return false;
		}

		if (typeQuery && !type.includes(typeQuery)) {
			return false;
		}

		if (descriptionQuery && !description.includes(descriptionQuery)) {
			return false;
		}

		return true;
	});

	const clearColumnFilters = () => {
		setColumnNameFilter("");
		setColumnTypeFilter("");
		setColumnDescriptionFilter("");
	};

	const changedColumnCount = columns.reduce((count, column) => {
		const original = (column.business_description || "").trim();
		const current = (columnDescriptionDrafts[column.column_id] || "").trim();
		return original !== current ? count + 1 : count;
	}, 0);

	const isColumnEdited = (column: MetadataColumnDetail): boolean => {
		const original = (column.business_description || "").trim();
		const current = (columnDescriptionDrafts[column.column_id] || "").trim();
		return original !== current;
	};

	return (
		<div className="space-y-5">
			<section className="surface p-6">
				<h2 className="font-display text-3xl text-blue-950">Data Governance</h2>
				<p className="mt-1 text-sm text-blue-900/75">
					Navigate Domain to Sub Domain to Database or Cosmos Database and inspect metadata
					nodes with steward-ready descriptions.
				</p>

				<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
					<select
						className="select-field"
						disabled={isLoadingHierarchy}
						onChange={(event) => setDomainId(event.target.value)}
						value={domainId}
					>
						<option value="">Select Domain</option>
						{(hierarchy?.domains || []).map((domain) => (
							<option key={domain.id} value={domain.id}>
								{domain.name}
							</option>
						))}
					</select>

					<select
						className="select-field"
						disabled={!selectedDomain}
						onChange={(event) => setSubDomainId(event.target.value)}
						value={subDomainId}
					>
						<option value="">Select Sub Domain</option>
						{(selectedDomain?.sub_domains || []).map((subDomain) => (
							<option key={subDomain.id} value={subDomain.id}>
								{subDomain.name}
							</option>
						))}
					</select>

					<select
						className="select-field"
						disabled={!selectedSubDomain}
						onChange={(event) => setStoreType(event.target.value as MetadataStoreType)}
						value={storeType}
					>
						{STORE_TYPES.map((type) => (
							<option key={type} value={type}>
								{type === "CosmosDatabase" ? "Cosmos Database" : "Database"}
							</option>
						))}
					</select>

					<select
						className="select-field"
						disabled={!selectedSubDomain}
						onChange={(event) => setStoreId(event.target.value)}
						value={storeId}
					>
						<option value="">
							Select {storeType === "CosmosDatabase" ? "Cosmos Database" : "Database"}
						</option>
						{stores.map((store) => (
							<option key={store.id} value={store.id}>
								{store.name}
							</option>
						))}
					</select>

					<select
						className="select-field"
						disabled={!selectedStore}
						onChange={(event) => setSchemaId(event.target.value)}
						value={schemaId}
					>
						<option value="">Select Schema</option>
						{schemas.map((schema) => (
							<option key={schema.id} value={schema.id}>
								{schema.name}
							</option>
						))}
					</select>

					<select
						className="select-field"
						disabled={!selectedSchema}
						onChange={(event) => setAssetId(event.target.value)}
						value={assetId}
					>
						<option value="">Select {assetSelectorLabel}</option>
						{assets.map((asset) => (
							<option key={asset.id} value={asset.id}>
								{asset.name}
							</option>
						))}
					</select>
				</div>

				{isLoadingHierarchy ? (
					<p className="mt-3 text-sm text-blue-900/70">Loading metadata hierarchy...</p>
				) : null}

				{message ? <div className="alert-success mt-4 text-sm">{message}</div> : null}

				{error ? (
					<div className="alert-error mt-4 overflow-auto text-xs">{error}</div>
				) : null}

				{debugInfo ? (
					<div className="mt-3 rounded-md border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900">
						<p className="font-semibold">Debug Context</p>
						<p>Operation: {debugInfo.operation}</p>
						<p>Endpoint: {debugInfo.endpoint}</p>
						<p>Status: {debugInfo.statusCode ?? "pending/success"}</p>
						<p>
							Selection: store_type={storeType}, domain={domainId || "-"}, sub_domain={subDomainId || "-"},
							 store={storeId || "-"}, schema={schemaId || "-"}, asset={assetId || "-"}
						</p>
					</div>
				) : null}
			</section>

			<section className="surface p-5">
				<h3 className="text-lg font-semibold text-blue-950">Metadata Editor</h3>
				{selectedAsset ? (
					<div className="mt-3 space-y-4 text-sm text-blue-900">
						{isLoadingDetail ? <p>Loading asset details from graph DB...</p> : null}
						<div className="rounded-xl border border-blue-100 bg-white p-3">
							<p className="text-sm font-semibold text-blue-950">
								{metadataEntityLabel}s for {selectedAsset.name}
							</p>
							{columns.length > 0 ? (
								<div className="mt-3 space-y-3">
									<div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
										<input
											className="input-field"
											onChange={(event) => setColumnNameFilter(event.target.value)}
											placeholder={`Filter by ${metadataEntityLabelLower} name`}
											value={columnNameFilter}
										/>
										<input
											className="input-field"
											onChange={(event) => setColumnTypeFilter(event.target.value)}
											placeholder="Filter by data type"
											value={columnTypeFilter}
										/>
										<input
											className="input-field"
											onChange={(event) => setColumnDescriptionFilter(event.target.value)}
											placeholder="Filter by business description"
											value={columnDescriptionFilter}
										/>
										<button
											className="btn-secondary"
											onClick={clearColumnFilters}
											type="button"
										>
											Clear Filters
										</button>
									</div>
									<p className="text-xs text-blue-800/75">
										Showing {filteredColumns.length} of {columns.length} {metadataEntityLabelLower}s
									</p>
									<div className="overflow-x-auto">
										<table className="min-w-full border-collapse text-left text-xs">
											<thead>
												<tr className="border-b border-blue-200 text-blue-800">
													<th className="px-2 py-2 font-semibold">{metadataEntityLabel} Name</th>
													<th className="px-2 py-2 font-semibold">Data Type</th>
													<th className="px-2 py-2 font-semibold">{metadataEntityLabel} Description</th>
													<th className="px-2 py-2 font-semibold">LLM Confidence</th>
												</tr>
											</thead>
											<tbody>
												{filteredColumns.map((column) => (
													<tr className="border-b border-blue-100" key={column.column_id}>
														<td className="px-2 py-2 font-medium text-blue-950">{column.name}</td>
														<td className="px-2 py-2">{column.data_type || "N/A"}</td>
														<td className="px-2 py-2">
															<textarea
																className="textarea-field min-h-32"
																onChange={(event) =>
																	setColumnDescriptionDrafts((previous) => ({
																		...previous,
																		[column.column_id]: event.target.value,
																	}))
																}
																placeholder={`Edit ${metadataEntityLabelLower} description`}
																value={columnDescriptionDrafts[column.column_id] || ""}
															/>
														</td>
														<td className="px-2 py-2">
															{isColumnEdited(column)
																? "100.0%"
																: typeof column.llm_confidence === "number"
																	? `${(column.llm_confidence * 100).toFixed(1)}%`
																: "N/A"}
														</td>
													</tr>
												))}
												{filteredColumns.length === 0 ? (
													<tr>
														<td className="px-2 py-4 text-blue-900/70" colSpan={4}>
															No {metadataEntityLabelLower}s match the active filters.
														</td>
													</tr>
												) : null}
											</tbody>
											</table>
										</div>
								</div>
							) : (
								<p className="mt-2 text-blue-900/70">
									No {metadataEntityLabelLower}s were returned for this {selectedAsset.asset_type.toLowerCase()}.
								</p>
							)}

							<div className="mt-4 border-t border-blue-100 pt-4">
								<p className="text-sm font-semibold text-blue-950">Bulk {metadataEntityLabel} Update</p>
								<p className="mt-1 text-xs text-blue-800/75">
									{changedColumnCount} {metadataEntityLabelLower} description change(s) pending
								</p>

								<div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto_auto]">
									<input
										className="input-field"
										onChange={(event) => setStewardName(event.target.value)}
										placeholder="Data steward name"
										value={stewardName}
									/>
									<button
										className="btn-primary"
										disabled={!selectedAsset || isSavingDescription || changedColumnCount === 0}
										onClick={saveDescription}
										type="button"
									>
										{isSavingDescription ? "Saving..." : `Bulk Update ${metadataEntityLabel} Descriptions`}
									</button>
									<button
										className="btn-secondary"
										disabled={!selectedAsset || isProcessingApprovals}
										onClick={processApprovedDescriptions}
										type="button"
									>
										{isProcessingApprovals ? "Processing..." : "Process Approved"}
									</button>
								</div>
							</div>
						</div>

					</div>
				) : (
					<p className="mt-3 text-sm text-blue-900/70">
						Select Domain, Sub Domain, Store, Schema, and {assetSelectorLabel} to edit metadata descriptions.
					</p>
				)}
			</section>
		</div>
	);
}