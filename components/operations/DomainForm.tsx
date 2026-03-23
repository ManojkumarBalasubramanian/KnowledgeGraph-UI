"use client";

import { useEffect, useState } from "react";
import { createDomain, getMetadataExplorerHierarchy } from "@/services/graphService";
import type { CreateDomainResponse, MetadataExplorerEnterprise } from "@/types/api";

export default function DomainForm() {
	const [enterprises, setEnterprises] = useState<MetadataExplorerEnterprise[]>([]);
	const [selectedEnterpriseId, setSelectedEnterpriseId] = useState("");
	const [loadingEnterprises, setLoadingEnterprises] = useState(false);
	const [formData, setFormData] = useState({
		domain_id: "",
		name: "",
		description: "",
	});
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState<CreateDomainResponse | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadEnterprises = async () => {
			setLoadingEnterprises(true);
			try {
				const hierarchy = await getMetadataExplorerHierarchy();
				const items = hierarchy.enterprises ?? [];
				setEnterprises(items);
				if (items.length > 0) {
					setSelectedEnterpriseId(items[0].id);
				}
			} catch (err) {
				console.error("Failed to load enterprises:", err);
				setError("Failed to load enterprise data from backend");
			} finally {
				setLoadingEnterprises(false);
			}
		};

		loadEnterprises();
	}, []);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedEnterpriseId) {
			setError("No enterprise available. Please create enterprise data in backend first.");
			return;
		}

		setLoading(true);
		setError(null);
		setSuccess(null);

		try {
			const payload = {
				domain_id: formData.domain_id,
				name: formData.name,
				description: formData.description || undefined,
				enterprise_id: selectedEnterpriseId,
			};

			const response = await createDomain(payload);
			setSuccess(response);

			// Reset form
			setFormData({
				domain_id: "",
				name: "",
				description: "",
			});

			// Clear success message after 5 seconds
			setTimeout(() => setSuccess(null), 5000);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to create domain",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="rounded-lg border border-blue-200 bg-white p-6">
			<h2 className="mb-4 text-lg font-semibold text-blue-950">Create Domain</h2>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-blue-900">
						Domain ID <span className="text-red-500">*</span>
					</label>
					<input
						type="text"
						name="domain_id"
						value={formData.domain_id}
						onChange={handleChange}
						placeholder="e.g., domain-supply-chain"
						required
						className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-4 py-2 text-blue-950 placeholder-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-blue-900">
						Domain Name <span className="text-red-500">*</span>
					</label>
					<input
						type="text"
						name="name"
						value={formData.name}
						onChange={handleChange}
						placeholder="e.g., Supply Chain"
						required
						className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-4 py-2 text-blue-950 placeholder-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-blue-900">
						Enterprise
					</label>
					<select
						value={selectedEnterpriseId}
						onChange={(e) => setSelectedEnterpriseId(e.target.value)}
						disabled={loadingEnterprises || enterprises.length === 0}
						className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-blue-950 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
					>
						<option value="">
							{loadingEnterprises
								? "Loading enterprises..."
								: enterprises.length === 0
									? "No enterprise data available"
									: "Select enterprise"}
						</option>
						{enterprises.map((enterprise) => (
							<option key={enterprise.id} value={enterprise.id}>
								{enterprise.name} ({enterprise.id})
							</option>
						))}
					</select>
				</div>

				<div>
					<label className="block text-sm font-medium text-blue-900">
						Description
					</label>
					<textarea
						name="description"
						value={formData.description}
						onChange={handleChange}
						placeholder="Optional description for this domain"
						rows={3}
						className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-4 py-2 text-blue-950 placeholder-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
					/>
				</div>

				{error && (
					<div className="rounded-lg border border-red-200 bg-red-50 p-3">
						<p className="text-sm text-red-700">{error}</p>
					</div>
				)}

				{success && (
					<div className="rounded-lg border border-green-200 bg-green-50 p-3">
						<p className="text-sm font-medium text-green-800">
							{success.message}
						</p>
						<p className="text-xs text-green-700 mt-1">
							Domain ID: {success.domain_id}
						</p>
					</div>
				)}

				<button
					type="submit"
					disabled={loading || loadingEnterprises || !selectedEnterpriseId}
					className="w-full rounded-lg bg-gradient-to-r from-[#005cb9] via-[#1b73cf] to-[#e32934] px-4 py-2 font-semibold text-white transition hover:shadow-lg disabled:opacity-50"
				>
					{loading ? "Creating..." : "Create Domain"}
				</button>
			</form>
		</div>
	);
}
