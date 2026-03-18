"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const mainCategories = [
	{
		heading: "LLM Studio",
		links: [{ href: "/llm", label: "LLM Workspace" }],
	},
	{
		heading: "Platform",
		links: [
			{ href: "/", label: "Overview" },
			{ href: "/dashboard", label: "Operations" },
		],
	},
	{
		heading: "Knowledge Graph",
		links: [
			{ href: "/graph", label: "Metadata Explorer" },
			{ href: "/relationships", label: "Relationships" },
			{ href: "/node-search", label: "Node Search" },
		],
	},
	{
		heading: "Onboarding",
		links: [
			{ href: "/onboard/sql", label: "SQL Server" },
			{ href: "/onboard/cosmos", label: "Cosmos" },
			{ href: "/onboard/kafka", label: "Kafka" },
		],
	},
];

export default function Sidebar() {
	const pathname = usePathname();
	const activeCategory = useMemo(
		() =>
			mainCategories.find((category) =>
				category.links.some((link) => link.href === pathname),
			)?.heading || mainCategories[0].heading,
		[pathname],
	);
	const [selectedCategory, setSelectedCategory] = useState(activeCategory);

	const visibleCategory = selectedCategory || activeCategory;

	return (
		<aside className="w-full border-b border-blue-200 bg-[#003a8c] text-blue-50 md:min-h-[calc(100vh-4rem)] md:w-72 md:border-b-0 md:border-r md:border-r-blue-900/50">
			<div className="p-4 md:p-6">
				<p className="text-xs uppercase tracking-[0.24em] text-blue-100/70">Navigate</p>
				<div className="mt-4 space-y-3">
					{mainCategories.map((category) => {
						const isSelected = visibleCategory === category.heading;
						const categoryHasActive = category.links.some((link) => link.href === pathname);

						return (
							<div key={category.heading}>
								<button
									type="button"
									onClick={() => setSelectedCategory(category.heading)}
									className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
										isSelected || categoryHasActive
											? "bg-gradient-to-r from-[#005cb9] via-[#1b73cf] to-[#e32934] text-white"
											: "text-blue-100/90 hover:bg-blue-800/60 hover:text-white"
									}`}
								>
									{category.heading}
								</button>

								{isSelected ? (
									<ul className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-1">
										{category.links.map((link) => {
											const active = pathname === link.href;
											return (
												<li key={link.href}>
													<Link
														href={link.href}
														className={`block rounded-lg px-3 py-2 text-sm transition ${
															active
																? "bg-white text-blue-900"
																: "text-blue-100/85 hover:bg-blue-800/60 hover:text-white"
														}`}
													>
														{link.label}
													</Link>
												</li>
											);
										})}
									</ul>
								) : null}
							</div>
						);
					})}
				</div>
			</div>
		</aside>
	);
}