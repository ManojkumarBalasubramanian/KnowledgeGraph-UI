import SQLForm from "@/components/onboarding/SQLForm";

export default function Page() {
	return (
		<div className="space-y-4">
			<p className="text-sm text-blue-900/75">
				Endpoints: <span className="mono">/api/graph/metadata-explorer/hierarchy + /api/onboard/sql/catalog + /api/onboard/sql</span>
			</p>
			<SQLForm />
		</div>
	);
}