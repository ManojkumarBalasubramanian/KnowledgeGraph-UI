import CosmosForm from "@/components/onboarding/CosmosForm";

export default function Page() {
	return (
		<div className="space-y-4">
			<p className="text-sm text-blue-900/75">
				Endpoint: <span className="mono">POST /api/onboard/cosmos</span>
			</p>
			<CosmosForm />
		</div>
	);
}