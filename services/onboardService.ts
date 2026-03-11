import { api } from "./api";
import type {
	CosmosOnboardRequest,
	CosmosOnboardResponse,
	KafkaOnboardRequest,
	KafkaOnboardResponse,
	SQLDescriptionListRequest,
	SQLDescriptionListResponse,
	SQLDescriptionsDiagnosticsRequest,
	SQLDescriptionsDiagnosticsResponse,
	SQLOnboardRequest,
	SQLOnboardResponse,
} from "@/types/api";

export const onboardSQL = async (
	payload: SQLOnboardRequest,
): Promise<SQLOnboardResponse> =>
	api.post<SQLOnboardResponse>("/api/onboard/sql", payload);

export const listSQLDescriptions = async (
	payload: SQLDescriptionListRequest,
): Promise<SQLDescriptionListResponse> =>
	api.post<SQLDescriptionListResponse>("/api/onboard/sql/descriptions/list", payload);

export const getSQLDescriptionsDiagnostics = async (
	payload: SQLDescriptionsDiagnosticsRequest,
): Promise<SQLDescriptionsDiagnosticsResponse> =>
	api.post<SQLDescriptionsDiagnosticsResponse>(
		"/api/onboard/sql/descriptions/diagnostics",
		payload,
	);

export const onboardCosmos = async (
	payload: CosmosOnboardRequest,
): Promise<CosmosOnboardResponse> =>
	api.post<CosmosOnboardResponse>("/api/onboard/cosmos", payload);

export const onboardKafka = async (
	payload: KafkaOnboardRequest,
): Promise<KafkaOnboardResponse> =>
	api.post<KafkaOnboardResponse>("/api/onboard/kafka", payload);