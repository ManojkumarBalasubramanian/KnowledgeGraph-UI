"use client";

import { useState, useEffect } from "react";
import { createSubDomain, getMetadataExplorerHierarchy } from "@/services/graphService";
import type { CreateSubDomainResponse, MetadataExplorerDomain } from "@/types/api";

export default function SubDomainForm() {
	const [formData, setFormData] = useState({
		sub_domain_id: "",
		name: "",
		description: "",
		domain_id: "",
	});
	const [domains, setDomains] = useState<MetadataExplorerDomain[]>([]);
	const [loading, setLoading] = useState(false);
	const [loadingDomains, setLoadingDomains] = useState(false);
	const [success, setSuccess] = useState<CreateSubDomainResponse | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Load existing domains on mount
	useEffect(() => {
		const loadDomains = async () => {
			setLoadingDomains(true);
			try {
				const hierarchy = await getMetadataExplorerHierarchy();
				setDomains(hierarchy.domains);
			} catch (err) {
				console.error("Failed to load domains:", err);
			} finally {
				setLoadingDomains(false);
			}
		};

		loadDomains();
	}, []);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);
		setSuccess(null);

		try {
			const payload = {
				sub_domain_id: formData.sub_domain_id,
				name: formData.name,
				description: formData.description || undefined,
				domain_id: formData.domain_id || undefined,
			};

			const response = await createSubDomain(payload);
			setSuccess(response);

			// Reset form
			setFormData({
				sub_domain_id: "",
				name: "",
				description: "",
				domain_id: "",
			});

			// Clear success message after 5 seconds
			setTimeout(() => setSuccess(null), 5000);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to create subdomain",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="rounded-lg border border-blue-200 bg-white p-6">
			<h2 className="mb-4 text-lg font-semibold text-blue-950">Create Sub Domain</h2>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-blue-900">
						Sub Domain ID <span className="text-red-500">*</span>
					</label>
					<input
						type="text"
						name="sub_domain_id"
						value={formData.sub_domain_id}
						onChange={handleChange}
						placeholder="e.g., subdomain-supply-chain-transportation"
						required
						className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-4 py-2 text-blue-950 placeholder-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-blue-900">
						Sub Domain Name <span className="text-red-500">*</span>
					</label>
					<input
						type="text"
						name="name"
						value={formData.name}
						onChange={handleChange}
						placeholder="e.g., Transportation"
						required
						className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-4 py-2 text-blue-950 placeholder-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-blue-900">
						Parent Domain (Optional)
					</label>
					<select
						name="domain_id"
						value={formData.domain_id}
						onChange={handleChange}
						disabled={loadingDomains}
						className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-4 py-2 text-blue-950 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
					>
						<option value="">
							{loadingDomains ? "Loading domains..." : "Select a domain (optional)"}
						</option>
						{domains.map((domain) => (
							<option key={domain.id} value={domain.id}>
								{domain.name} ({domain.id})
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
						placeholder="Optional description for this subdomain"
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
							Sub Domain ID: {success.sub_domain_id}
						</p>
					</div>
				)}

				<button
					type="submit"
					disabled={loading}
					className="w-full rounded-lg bg-gradient-to-r from-[#005cb9] via-[#1b73cf] to-[#e32934] px-4 py-2 font-semibold text-white transition hover:shadow-lg disabled:opacity-50"
				>
					{loading ? "Creating..." : "Create Sub Domain"}
				</button>
			</form>
		</div>
	);
}
