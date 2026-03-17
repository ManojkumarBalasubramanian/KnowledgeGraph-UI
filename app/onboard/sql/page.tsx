import SQLForm from "@/components/onboarding/SQLForm";

export default function Page() {
	return (
		<div className="space-y-4">
			<p className="text-sm text-blue-900/75">
				Endpoints: <span className="mono">/api/onboard/sql/catalog + /api/onboard/sql + /api/onboard/sql/descriptions/list + /api/onboard/sql/descriptions/diagnostics</span>
			</p>
			<SQLForm />
		</div>
	);
}