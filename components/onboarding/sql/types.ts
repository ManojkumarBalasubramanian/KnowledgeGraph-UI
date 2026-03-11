import type {
	SQLDescriptionItem,
	SQLDescriptionsDiagnosticsResponse,
	SQLOnboardResponse,
} from "@/types/api";

export type SQLApprovedFilter = "Yes" | "No" | "";

export type AsyncAction = () => Promise<void>;
export type ValueChangeHandler<T> = (value: T) => void;

export interface SQLOnboardingPanelProps {
	connectionString: string;
	onConnectionStringChange: ValueChangeHandler<string>;
	isOnboarding: boolean;
	isLoadingQueue: boolean;
	onSubmit: AsyncAction;
	onLoadQueue: AsyncAction;
	onboardResponse: SQLOnboardResponse | null;
}

export interface SQLReviewQueuePanelProps {
	approvedFilter: SQLApprovedFilter;
	onApprovedFilterChange: ValueChangeHandler<SQLApprovedFilter>;
	databaseFilter: string;
	onDatabaseFilterChange: ValueChangeHandler<string>;
	schemaFilter: string;
	onSchemaFilterChange: ValueChangeHandler<string>;
	tableFilter: string;
	onTableFilterChange: ValueChangeHandler<string>;
	queueLimit: string;
	onQueueLimitChange: ValueChangeHandler<string>;
	filteredQueue: SQLDescriptionItem[];
}

export interface SQLDiagnosticsPanelProps {
	isLoadingDiagnostics: boolean;
	onLoadDiagnostics: AsyncAction;
	diagnostics: SQLDescriptionsDiagnosticsResponse | null;
}
