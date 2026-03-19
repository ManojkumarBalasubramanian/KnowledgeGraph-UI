import KafkaForm from "@/components/onboarding/KafkaForm";

export default function Page() {
	return (
		<div className="space-y-4">
			<p className="text-sm text-blue-900/75">
				Endpoints: <span className="mono">GET /api/graph/metadata-explorer/hierarchy + POST /api/onboard/kafka</span>
			</p>
			<KafkaForm />
		</div>
	);
}