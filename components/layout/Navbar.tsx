import Link from "next/link";

const quickLinks = [
	{ href: "/dashboard", label: "Dashboard" },
	{ href: "/graph", label: "Graph" },
	{ href: "/onboard/sql", label: "Onboard" },
];

export default function Navbar() {
	return (
		<header className="sticky top-0 z-20 border-b border-blue-100 bg-white/90 backdrop-blur">
			<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
				<div>
					<p className="text-xs uppercase tracking-[0.22em] text-blue-700/70">
							Enterprise Data Governance
					</p>
					<h1 className="font-display text-lg font-semibold text-blue-950">
						Cognitive AI Platform
					</h1>
				</div>

				<nav className="flex items-center gap-2">
					{quickLinks.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className="rounded-full border border-blue-200 px-3 py-1.5 text-sm text-blue-800 transition hover:border-blue-600 hover:text-blue-700"
						>
							{item.label}
						</Link>
					))}
				</nav>
			</div>
		</header>
	);
}