import { api } from "./api";
import type {
	CosmosOnboardRequest,
	CosmosOnboardResponse,
	KafkaOnboardRequest,
	KafkaOnboardResponse,
	SQLOnboardRequest,
	SQLOnboardResponse,
} from "@/types/api";

export const onboardSQL = async (
	payload: SQLOnboardRequest,
	sync = false,
): Promise<SQLOnboardResponse> =>
	api.post<SQLOnboardResponse>(`/api/onboard/sql?sync=${sync}`, payload);

export const onboardCosmos = async (
	payload: CosmosOnboardRequest,
): Promise<CosmosOnboardResponse> =>
	api.post<CosmosOnboardResponse>("/api/onboard/cosmos", payload);

export const onboardKafka = async (
	payload: KafkaOnboardRequest,
): Promise<KafkaOnboardResponse> =>
	api.post<KafkaOnboardResponse>("/api/onboard/kafka", payload);