import type { MetadataExplorerDomain, MetadataExplorerSubDomain } from "@/types/api";

interface DomainSubDomainFieldsProps {
	domains: MetadataExplorerDomain[];
	subDomains: MetadataExplorerSubDomain[];
	selectedDomainId: string;
	onSelectedDomainIdChange: (value: string) => void;
	selectedSubDomainId: string;
	onSelectedSubDomainIdChange: (value: string) => void;
	isLoadingHierarchy: boolean;
}

export default function DomainSubDomainFields({
	domains,
	subDomains,
	selectedDomainId,
	onSelectedDomainIdChange,
	selectedSubDomainId,
	onSelectedSubDomainIdChange,
	isLoadingHierarchy,
}: DomainSubDomainFieldsProps) {
	return (
		<div className="grid gap-3 md:grid-cols-2">
			<label className="space-y-1 text-sm text-blue-900">
				<span className="font-medium">Domain</span>
				<select
					className="select-field"
					disabled={isLoadingHierarchy || domains.length === 0}
					value={selectedDomainId}
					onChange={(event) => onSelectedDomainIdChange(event.target.value)}
				>
					<option value="">Select domain...</option>
					{domains.map((domain) => (
						<option key={domain.id} value={domain.id}>
							{domain.name}
						</option>
					))}
				</select>
			</label>

			<label className="space-y-1 text-sm text-blue-900">
				<span className="font-medium">Sub Domain</span>
				<select
					className="select-field"
					disabled={!selectedDomainId || isLoadingHierarchy}
					value={selectedSubDomainId}
					onChange={(event) => onSelectedSubDomainIdChange(event.target.value)}
				>
					<option value="">Select sub domain...</option>
					{subDomains.map((subDomain) => (
						<option key={subDomain.id} value={subDomain.id}>
							{subDomain.name}
						</option>
					))}
				</select>
			</label>
		</div>
	);
}