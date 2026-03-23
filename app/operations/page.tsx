"use client";

import DomainForm from "@/components/operations/DomainForm";
import SubDomainForm from "@/components/operations/SubDomainForm";

export default function OperationsPage() {
	return (
		<div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
			{/* Page Header */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-blue-950 mb-2">Operations</h1>
				<p className="text-blue-700">
					Manage and create domain and sub-domain hierarchies for the Knowledge Graph
				</p>
			</div>

			{/* Info Box */}
			<div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
				<p className="text-sm text-blue-800">
					<span className="font-medium">Note:</span> Enterprise options are loaded from backend hierarchy data and applied when creating new domains.
				</p>
			</div>

			{/* Forms Grid */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<DomainForm />
				<SubDomainForm />
			</div>

			{/* Help Section */}
			<div className="mt-8 rounded-lg border border-blue-200 bg-white p-6">
				<h2 className="mb-4 text-lg font-semibold text-blue-950">Guide</h2>
				<div className="space-y-4 text-sm text-blue-800">
					<div>
						<h3 className="font-semibold text-blue-900 mb-1">Creating a Domain</h3>
						<p>
							A Domain represents a high-level business area or division (e.g., &quot;Supply Chain&quot;, &quot;Finance&quot;, &quot;Operations&quot;). Use unique domain IDs with descriptive names to organize your Knowledge Graph.
						</p>
					</div>
					<div>
						<h3 className="font-semibold text-blue-900 mb-1">Creating a Sub Domain</h3>
						<p>
							A Sub Domain is a subdivision within a Domain (e.g., &quot;Transportation&quot; under &quot;Supply Chain&quot;). You can optionally link it to a parent Domain by selecting from the dropdown list.
						</p>
					</div>
					<div>
						<h3 className="font-semibold text-blue-900 mb-1">Best Practices</h3>
						<ul className="list-inside list-disc space-y-1">
							<li>Use consistent naming conventions for Domain and Sub Domain IDs</li>
							<li>Make IDs descriptive and easily recognizable (e.g., domain-supply-chain, subdomain-transportation)</li>
							<li>Add descriptions to help team members understand the purpose of each hierarchy level</li>
							<li>Create parent Domains before creating Sub Domains under them</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}
