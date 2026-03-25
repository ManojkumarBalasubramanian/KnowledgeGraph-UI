"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const categoryIcons: Record<string, string> = {
	Overview: "home",
	Onboarding: "upload",
	"Knowledge Graph": "graph",
	"LLM Playground": "spark",
	Operations: "settings",
};

const Icon = ({ name, active = false }: { name: string; active?: boolean }) => {
	const common = {
		width: 17,
		height: 17,
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: active ? 2.3 : 2,
		strokeLinecap: "round" as const,
		strokeLinejoin: "round" as const,
	};

	if (name === "home") {
		return (
			<svg {...common} aria-hidden="true">
				<path d="m4 10 8-6 8 6" />
				<path d="M6 10v9h12v-9" />
				<path d="M10 19v-4h4v4" />
			</svg>
		);
	}

	if (name === "upload") {
		return (
			<svg {...common} aria-hidden="true">
				<path d="M12 14V6" />
				<path d="m8.5 9.5 3.5-3.5 3.5 3.5" />
				<path d="M5 16.5h14" />
				<path d="M7 16.5v2h10v-2" />
			</svg>
		);
	}

	if (name === "graph") {
		return (
			<svg {...common} aria-hidden="true">
				<circle cx="6" cy="7" r="2" />
				<circle cx="18" cy="7" r="2" />
				<circle cx="12" cy="17" r="2" />
				<path d="M8 8.2 10.7 15" />
				<path d="M16 8.2 13.3 15" />
				<path d="M8 7h8" />
			</svg>
		);
	}

	if (name === "spark") {
		return (
			<svg {...common} aria-hidden="true">
				<path d="M7 8a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3h-2.2L9 17v-3H8a3 3 0 0 1-3-3V8Z" />
				<path d="m15.5 5.5.5 1.2 1.2.5-1.2.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5.5-1.2Z" />
			</svg>
		);
	}

	return (
		<svg {...common} aria-hidden="true">
			<path d="M6 7h12" />
			<path d="M6 12h12" />
			<path d="M6 17h12" />
			<circle cx="9" cy="7" r="1.6" />
			<circle cx="15" cy="12" r="1.6" />
			<circle cx="11" cy="17" r="1.6" />
		</svg>
	);
};

const mainCategories = [
	{
		heading: "Overview",
		links: [{ href: "/", label: "Overview" }],
	},
	{
		heading: "Onboarding",
		links: [
			{ href: "/onboard/sql", label: "SQL Server" },
			{ href: "/onboard/cosmos", label: "Cosmos" },
			{ href: "/onboard/kafka", label: "Kafka" },
		],
	},
	{
		heading: "Knowledge Graph",
		links: [
			{ href: "/graph", label: "Data Governance" },
			{ href: "/relationships", label: "Relationships" },
			{ href: "/node-search", label: "Node Search" },
		],
	},
	{
		heading: "LLM Playground",
		links: [{ href: "/llm", label: "LLM Workspace" }],
	},
	{
		heading: "Operations",
		links: [
			{ href: "/operations", label: "Hierarchy Management" },
			{ href: "/dashboard", label: "Dashboard" },
		],
	},
];

export default function Sidebar() {
	const pathname = usePathname();
	const [isCollapsed, setIsCollapsed] = useState(false);
	const activeCategory = useMemo(
		() =>
			mainCategories.find((category) =>
				category.links.some((link) => link.href === pathname),
			)?.heading ?? mainCategories[0].heading,
		[pathname],
	);
	const [expandedCategory, setExpandedCategory] = useState(activeCategory);

	return (
		<aside
			className={`w-full border-b border-blue-200 bg-[#003a8c] text-blue-50 md:min-h-[calc(100vh-4rem)] md:border-b-0 md:border-r md:border-r-blue-900/50 md:transition-all md:duration-200 ${
				isCollapsed ? "md:w-20" : "md:w-72"
			}`}
		>
			<div className="p-4 md:p-4">
				<div className="flex items-center justify-between">
					{!isCollapsed ? (
						<p className="text-xs uppercase tracking-[0.24em] text-blue-100/70">Navigate</p>
					) : (
						<span className="hidden md:block text-xs uppercase tracking-[0.2em] text-blue-100/60">
							Menu
						</span>
					)}
					<button
						type="button"
						onClick={() => setIsCollapsed((prev) => !prev)}
						className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg border border-blue-300/40 text-blue-100 hover:bg-blue-800/60 hover:text-white"
						title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
						aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
					>
						{isCollapsed ? (
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<path d="m9 18 6-6-6-6" />
							</svg>
						) : (
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<path d="m15 18-6-6 6-6" />
							</svg>
						)}
					</button>
				</div>

				<div className="mt-4 space-y-3">
					{isCollapsed ? (
						<ul className="hidden md:grid gap-2 place-items-center">
							{mainCategories.map((category) => {
								const active = category.links.some((link) => link.href === pathname);
								const iconName = categoryIcons[category.heading] ?? "settings";
								return (
									<li key={category.heading}>
										<button
											type="button"
											onClick={() => {
												setIsCollapsed(false);
												setExpandedCategory(category.heading);
											}}
											title={category.heading}
											aria-label={category.heading}
											className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${
												active
													? "border-blue-100 bg-gradient-to-r from-[#005cb9] via-[#1b73cf] to-[#e32934] text-white"
													: "border-blue-300/30 text-blue-100/90 hover:bg-blue-800/60 hover:text-white"
											}`}
										>
											<Icon name={iconName} active={active} />
										</button>
									</li>
								);
							})}
						</ul>
					) : null}

					{!isCollapsed
						? mainCategories.map((category) => {
						const iconName = categoryIcons[category.heading] ?? "settings";
						const isSingleLink = category.links.length === 1;
						const categoryHasActive = category.links.some((link) => link.href === pathname);
						const isExpanded = expandedCategory === category.heading;

						// Single-link categories navigate directly — no nesting
						if (isSingleLink) {
							const link = category.links[0];
							const active = pathname === link.href;
							return (
								<div key={category.heading}>
									<Link
										href={link.href}
										className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
											active
												? "bg-gradient-to-r from-[#005cb9] via-[#1b73cf] to-[#e32934] text-white"
												: "text-blue-100/90 hover:bg-blue-800/60 hover:text-white"
										}`}
									>
										<span className="inline-flex items-center gap-2">
											<Icon name={iconName} active={active} />
											{category.heading}
										</span>
									</Link>
								</div>
							);
						}

						// Multi-link categories expand to show sub-links
						return (
							<div key={category.heading}>
								<button
									type="button"
									onClick={() =>
										setExpandedCategory(isExpanded ? "" : category.heading)
									}
									className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
										isExpanded || categoryHasActive
											? "bg-gradient-to-r from-[#005cb9] via-[#1b73cf] to-[#e32934] text-white"
											: "text-blue-100/90 hover:bg-blue-800/60 hover:text-white"
									}`}
								>
									<span className="inline-flex items-center gap-2">
										<Icon name={iconName} active={isExpanded || categoryHasActive} />
										{category.heading}
									</span>
								</button>

								{isExpanded ? (
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
						})
						: null}
				</div>
			</div>
		</aside>
	);
}