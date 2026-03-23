"use client";

import { useEffect, useMemo, useState } from "react";
import { formatAPIError } from "@/services/api";
import { getMetadataExplorerHierarchy } from "@/services/graphService";
import type { MetadataExplorerDomain, MetadataExplorerEnterprise } from "@/types/api";

export function useMetadataHierarchy() {
	const [domains, setDomains] = useState<MetadataExplorerDomain[]>([]);
	const [enterprises, setEnterprises] = useState<MetadataExplorerEnterprise[]>([]);
	const [selectedDomainId, setSelectedDomainId] = useState("");
	const [selectedSubDomainId, setSelectedSubDomainId] = useState("");
	const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(false);
	const [hierarchyError, setHierarchyError] = useState("");

	useEffect(() => {
		const loadHierarchy = async () => {
			setIsLoadingHierarchy(true);
			setHierarchyError("");

			try {
				const result = await getMetadataExplorerHierarchy();
				setDomains(result.domains);
				setEnterprises(result.enterprises ?? []);
			} catch (err) {
				setHierarchyError(
					formatAPIError(err, "Failed to load Domain/Sub Domain hierarchy."),
				);
			} finally {
				setIsLoadingHierarchy(false);
			}
		};

		void loadHierarchy();
	}, []);

	useEffect(() => {
		setSelectedSubDomainId("");
	}, [selectedDomainId]);

	const subDomains = useMemo(() => {
		const selectedDomain = domains.find((domain) => domain.id === selectedDomainId);
		return selectedDomain?.sub_domains ?? [];
	}, [domains, selectedDomainId]);

	const selectedEnterpriseId = useMemo(() => {
		if (!selectedDomainId || enterprises.length === 0) {
			return "";
		}

		const match = enterprises.find((enterprise) =>
			(enterprise.domains || []).some((domain) => domain.id === selectedDomainId),
		);

		return match?.id ?? "";
	}, [enterprises, selectedDomainId]);

	return {
		domains,
		enterprises,
		selectedDomainId,
		setSelectedDomainId,
		selectedSubDomainId,
		setSelectedSubDomainId,
		selectedEnterpriseId,
		subDomains,
		isLoadingHierarchy,
		hierarchyError,
	};
}