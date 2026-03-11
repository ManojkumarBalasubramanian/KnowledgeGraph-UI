import type { SQLOnboardingPanelProps } from "./types";

export default function SQLOnboardingPanel({
	connectionString,
	onConnectionStringChange,
	isOnboarding,
	isLoadingQueue,
	onSubmit,
	onLoadQueue,
	onboardResponse,
}: SQLOnboardingPanelProps) {
	return (
		<section className="surface space-y-4 p-6">
			<h2 className="font-display text-2xl text-blue-950">SQL Server Onboarding</h2>

			<textarea
				className="textarea-field min-h-32"
				placeholder="DRIVER={ODBC Driver 18 for SQL Server};SERVER=...;DATABASE=...;UID=...;PWD=...;Encrypt=yes;"
				value={connectionString}
				onChange={(event) => onConnectionStringChange(event.target.value)}
			/>

			<div className="flex flex-wrap items-center gap-3">
				<button
					className="btn-primary"
					disabled={isOnboarding || !connectionString.trim()}
					onClick={() => void onSubmit()}
					type="button"
				>
					{isOnboarding ? "Running..." : "Start SQL Onboarding"}
				</button>
				<button
					className="btn-secondary"
					disabled={isLoadingQueue}
					onClick={() => void onLoadQueue()}
					type="button"
				>
					{isLoadingQueue ? "Loading queue..." : "Load Description Queue"}
				</button>
			</div>

			{onboardResponse ? (
				<pre className="alert-success overflow-auto text-xs">
					{JSON.stringify(onboardResponse, null, 2)}
				</pre>
			) : null}
		</section>
	);
}
