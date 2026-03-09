import KafkaForm from "@/components/onboarding/KafkaForm";

export default function Page() {
	return (
		<div className="space-y-4">
			<p className="text-sm text-blue-900/75">
				Endpoint: <span className="mono">POST /api/onboard/kafka</span>
			</p>
			<KafkaForm />
		</div>
	);
}