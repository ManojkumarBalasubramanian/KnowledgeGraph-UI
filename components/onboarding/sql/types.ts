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
	onSubmit: AsyncAction;
	onLoadCatalog: AsyncAction;
}
