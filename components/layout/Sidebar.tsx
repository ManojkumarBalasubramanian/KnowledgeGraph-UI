"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
	{ href: "/", label: "Overview" },
	{ href: "/dashboard", label: "Operations" },
	{ href: "/graph", label: "Graph Explorer" },
	{ href: "/relationships", label: "Relationships" },
	{ href: "/llm", label: "LLM Studio" },
	{ href: "/node-search", label: "Node Search" },
	{ href: "/onboard/sql", label: "Onboard SQL" },
	{ href: "/onboard/cosmos", label: "Onboard Cosmos" },
	{ href: "/onboard/kafka", label: "Onboard Kafka" },
];

export default function Sidebar() {
	const pathname = usePathname();

	return (
		<aside className="w-full border-b border-blue-200 bg-[#003a8c] text-blue-50 md:min-h-[calc(100vh-4rem)] md:w-72 md:border-b-0 md:border-r md:border-r-blue-900/50">
			<div className="p-4 md:p-6">
				<p className="text-xs uppercase tracking-[0.24em] text-blue-100/70">Navigate</p>
				<ul className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-1">
					{links.map((link) => {
						const active = pathname === link.href;
						return (
							<li key={link.href}>
								<Link
									href={link.href}
									className={`block rounded-lg px-3 py-2 text-sm transition ${
										active
											? "bg-gradient-to-r from-[#005cb9] via-[#1b73cf] to-[#e32934] text-white"
											: "text-blue-100/85 hover:bg-blue-800/60 hover:text-white"
									}`}
								>
									{link.label}
								</Link>
							</li>
						);
					})}
				</ul>
			</div>
		</aside>
	);
}