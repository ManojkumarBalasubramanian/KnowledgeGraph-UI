"use client";

import { useState } from "react";
import { APIRequestError } from "@/services/api";
import { onboardKafka } from "@/services/onboardService";
import type { KafkaOnboardResponse } from "@/types/api";

export default function KafkaForm() {
	const [bootstrapServers, setBootstrapServers] = useState("localhost:9092");
	const [isLoading, setIsLoading] = useState(false);
	const [response, setResponse] = useState<KafkaOnboardResponse | null>(null);
	const [error, setError] = useState("");

	const submit = async () => {
		setIsLoading(true);
		setError("");
		setResponse(null);

		try {
			const result = await onboardKafka({
				bootstrap_servers: bootstrapServers.trim(),
			});
			setResponse(result);
		} catch (err) {
			if (err instanceof APIRequestError) {
				setError(
					typeof err.detail === "string"
						? err.detail
						: JSON.stringify(err.detail, null, 2),
				);
			} else {
				setError("Kafka onboarding failed.");
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<section className="surface space-y-4 p-6">
			<h2 className="font-display text-2xl text-blue-950">Kafka Topic Onboarding</h2>

			<input
				className="input-field"
				placeholder="localhost:9092"
				value={bootstrapServers}
				onChange={(event) => setBootstrapServers(event.target.value)}
			/>

			<button
				className="btn-primary"
				disabled={isLoading || !bootstrapServers.trim()}
				onClick={submit}
				type="button"
			>
				{isLoading ? "Running..." : "Onboard Kafka"}
			</button>

			{error ? (
				<pre className="alert-error overflow-auto text-xs">
					{error}
				</pre>
			) : null}

			{response ? (
				<pre className="alert-success overflow-auto text-xs">
					{JSON.stringify(response, null, 2)}
				</pre>
			) : null}
		</section>
	);
}