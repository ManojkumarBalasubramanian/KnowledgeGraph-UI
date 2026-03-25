import type {
	MetadataExplorerDomain,
	MetadataExplorerSubDomain,
	SQLCatalogSchema,
} from "@/types/api";

export type AsyncAction = () => Promise<void>;
export type ValueChangeHandler<T> = (value: T) => void;

export interface SQLOnboardingPanelProps {
	domains: MetadataExplorerDomain[];
	selectedDomainId: string;
	onSelectedDomainIdChange: ValueChangeHandler<string>;
	selectedSubDomainId: string;
	onSelectedSubDomainIdChange: ValueChangeHandler<string>;
	subDomains: MetadataExplorerSubDomain[];
	isLoadingHierarchy: boolean;
	connectionString: string;
	onConnectionStringChange: ValueChangeHandler<string>;
	isOnboarding: boolean;
	isLoadingCatalog: boolean;
	catalog: SQLCatalogSchema[];
	selectedSchema: string;
	onSelectedSchemaChange: ValueChangeHandler<string>;
	selectedTable: string;
	onSelectedTableChange: ValueChangeHandler<string>;
	deltaOnly: boolean;
	onDeltaOnlyChange: ValueChangeHandler<boolean>;
	advancedPerformanceEnabled: boolean;
	onAdvancedPerformanceEnabledChange: ValueChangeHandler<boolean>;
	parallelEnabledSelection: "" | "true" | "false";
	onParallelEnabledSelectionChange: ValueChangeHandler<"" | "true" | "false">;
	maxWorkersInput: string;
	onMaxWorkersInputChange: ValueChangeHandler<string>;
	rollupBatchEnabledSelection: "" | "true" | "false";
	onRollupBatchEnabledSelectionChange: ValueChangeHandler<"" | "true" | "false">;
	optimizationMessage: string;
	onSubmit: AsyncAction;
	onLoadCatalog: AsyncAction;
}
