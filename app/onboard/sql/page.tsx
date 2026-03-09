import SQLForm from "@/components/onboarding/SQLForm";

export default function Page() {
	return (
		<div className="space-y-4">
			<p className="text-sm text-blue-900/75">
				Endpoint: <span className="mono">POST /api/onboard/sql?sync=false</span>
			</p>
			<SQLForm />
		</div>
	);
}