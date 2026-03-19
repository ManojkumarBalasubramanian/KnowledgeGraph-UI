import { api } from "./api";
import type {
	SQLCatalogRequest,
	SQLCatalogResponse,
	CosmosOnboardRequest,
	CosmosOnboardResponse,
	KafkaOnboardRequest,
	KafkaOnboardResponse,
	SQLOnboardRequest,
	SQLOnboardResponse,
} from "@/types/api";

export const fetchSQLCatalog = async (
	payload: SQLCatalogRequest,
): Promise<SQLCatalogResponse> =>
	api.post<SQLCatalogResponse>("/api/onboard/sql/catalog", payload);

export const onboardSQL = async (
	payload: SQLOnboardRequest,
): Promise<SQLOnboardResponse> =>
	api.post<SQLOnboardResponse>("/api/onboard/sql", payload);

export const onboardCosmos = async (
	payload: CosmosOnboardRequest,
): Promise<CosmosOnboardResponse> =>
	api.post<CosmosOnboardResponse>("/api/onboard/cosmos", payload);

export const onboardKafka = async (
	payload: KafkaOnboardRequest,
): Promise<KafkaOnboardResponse> =>
	api.post<KafkaOnboardResponse>("/api/onboard/kafka", payload);