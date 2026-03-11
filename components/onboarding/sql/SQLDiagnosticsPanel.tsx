import type { SQLDiagnosticsPanelProps } from "./types";

export default function SQLDiagnosticsPanel({
	isLoadingDiagnostics,
	onLoadDiagnostics,
	diagnostics,
}: SQLDiagnosticsPanelProps) {
	return (
		<section className="surface space-y-4 p-6">
			<h3 className="font-display text-xl text-blue-950">Diagnostics Panel</h3>
			<button
				className="btn-secondary"
				disabled={isLoadingDiagnostics}
				onClick={() => void onLoadDiagnostics()}
				type="button"
			>
				{isLoadingDiagnostics ? "Checking..." : "Run Diagnostics"}
			</button>

			{diagnostics ? (
				<pre className="code-panel overflow-auto text-xs">
					{JSON.stringify(diagnostics, null, 2)}
				</pre>
			) : null}
		</section>
	);
}
