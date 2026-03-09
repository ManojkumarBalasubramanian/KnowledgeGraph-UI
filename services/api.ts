export const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

export class APIRequestError extends Error {
	statusCode: number;
	detail?: unknown;

	constructor(message: string, statusCode: number, detail?: unknown) {
		super(message);
		this.name = "APIRequestError";
		this.statusCode = statusCode;
		this.detail = detail;
	}
}

export async function apiRequest<T>(
	endpoint: string,
	options: RequestInit = {},
): Promise<T> {
	const response = await fetch(`${API_BASE_URL}${endpoint}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...(options.headers || {}),
		},
		cache: "no-store",
	});

	const contentType = response.headers.get("content-type") || "";
	const isJson = contentType.includes("application/json");
	const payload = isJson
		? await response.json().catch(() => null)
		: await response.text().catch(() => "");

	if (!response.ok) {
		throw new APIRequestError(
			`Request failed: ${response.status} ${response.statusText}`,
			response.status,
			payload,
		);
	}

	return payload as T;
}

export const api = {
	get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: "GET" }),
	post: <T>(endpoint: string, body?: unknown) =>
		apiRequest<T>(endpoint, {
			method: "POST",
			body: body ? JSON.stringify(body) : undefined,
		}),
};