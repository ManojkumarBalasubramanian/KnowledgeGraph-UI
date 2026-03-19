import CosmosForm from "@/components/onboarding/CosmosForm";

export default function Page() {
	return (
		<div className="space-y-4">
			<p className="text-sm text-blue-900/75">
				Endpoints: <span className="mono">GET /api/graph/metadata-explorer/hierarchy + POST /api/onboard/cosmos</span>
			</p>
			<CosmosForm />
		</div>
	);
}