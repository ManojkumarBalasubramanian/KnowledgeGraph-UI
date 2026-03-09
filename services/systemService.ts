import { API_BASE_URL, api } from "./api";
import type { HealthStatus } from "@/types/api";

export const getHealth = async (): Promise<HealthStatus> =>
	api.get<HealthStatus>("/health");

export const getLiveHealth = async (): Promise<HealthStatus> =>
	api.get<HealthStatus>("/api/health/live");

export const getReadyHealth = async (): Promise<HealthStatus> =>
	api.get<HealthStatus>("/api/health/ready");

export const getMetrics = async (): Promise<string> => {
	const response = await fetch(`${API_BASE_URL}/metrics`, { cache: "no-store" });
	if (!response.ok) {
		throw new Error(`Metrics request failed: ${response.status}`);
	}
	return response.text();
};