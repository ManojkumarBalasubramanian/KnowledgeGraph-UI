"use client";

import { useState } from "react";
import { APIRequestError } from "@/services/api";
import { onboardSQL } from "@/services/onboardService";
import type { SQLOnboardResponse } from "@/types/api";

export default function SQLForm() {
	const [connectionString, setConnectionString] = useState("");
	const [sync, setSync] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [response, setResponse] = useState<SQLOnboardResponse | null>(null);
	const [error, setError] = useState("");

	const submit = async () => {
		setIsLoading(true);
		setError("");
		setResponse(null);

		try {
			const result = await onboardSQL(
				{ connection_string: connectionString.trim() },
				sync,
			);
			setResponse(result);
		} catch (err) {
			if (err instanceof APIRequestError) {
				setError(
					typeof err.detail === "string"
						? err.detail
						: JSON.stringify(err.detail, null, 2),
				);
			} else {
				setError("SQL onboarding failed.");
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<section className="surface space-y-4 p-6">
			<h2 className="font-display text-2xl text-blue-950">SQL Server Onboarding</h2>

			<textarea
				className="textarea-field min-h-32"
				placeholder="DRIVER={ODBC Driver 17 for SQL Server};SERVER=...;DATABASE=...;UID=...;PWD=..."
				value={connectionString}
				onChange={(event) => setConnectionString(event.target.value)}
			/>

			<label className="flex items-center gap-2 text-sm text-blue-900/80">
				<input
					checked={sync}
					onChange={(event) => setSync(event.target.checked)}
					type="checkbox"
				/>
				Run synchronously and return CSV metadata details
			</label>

			<button
				className="btn-primary"
				disabled={isLoading || !connectionString.trim()}
				onClick={submit}
				type="button"
			>
				{isLoading ? "Running..." : "Onboard SQL"}
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