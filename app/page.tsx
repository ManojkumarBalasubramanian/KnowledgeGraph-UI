"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getGraphStats } from "@/services/graphService";
import { getReadyHealth } from "@/services/systemService";

const featureCards = [
  {
    title: "Operations Dashboard",
    href: "/dashboard",
    description: "Monitor liveness, readiness, schema, and Prometheus metrics.",
  },
  {
    title: "Graph Explorer",
    href: "/graph",
    description: "Inspect nodes and relationships, run Cypher, and review results.",
  },
  {
    title: "Onboarding",
    href: "/onboard/sql",
    description: "Ingest metadata from SQL Server, Cosmos DB, and Kafka.",
  },
  {
    title: "LLM Studio",
    href: "/llm",
    description: "Generate detailed AI answers and lightweight responses.",
  },
  {
    title: "Node Search",
    href: "/node-search",
    description: "Search graph nodes by label and property filters.",
  },
  {
    title: "Manual Relationships",
    href: "/relationships",
    description: "Create governance and lineage relationships between assets.",
  },
];

export default function Home() {
  const [status, setStatus] = useState("loading");
  const [nodeCount, setNodeCount] = useState<number | null>(null);

  useEffect(() => {
    void getReadyHealth()
      .then((value) => setStatus(value.status))
      .catch(() => setStatus("unreachable"));

    void getGraphStats()
      .then((stats) => setNodeCount(stats.total_nodes))
      .catch(() => setNodeCount(null));
  }, []);

  return (
    <div className="space-y-6">
      <section className="surface overflow-hidden">
        <div className="bg-gradient-to-r from-[#003a8c] via-[#005cb9] to-[#e32934] p-7 text-white">
          <p className="text-sm uppercase tracking-[0.22em] text-blue-100">PepsiCo Supply Chain Hub</p>
          <h2 className="mt-2 text-4xl font-semibold">Enterprise Knowledge Graph</h2>
          <p className="mt-3 max-w-2xl text-blue-50">
            Built to explore and manage knowledge graph with ease. Dive into the graph, run queries, and leverage AI-powered insights to unlock the full potential of your data.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-white/15 px-3 py-1">Readiness: {status}</span>
            <span className="rounded-full bg-white/15 px-3 py-1">
              Total Nodes: {nodeCount ?? "n/a"}
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {featureCards.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="surface group p-5 transition hover:border-blue-500 hover:shadow-lg"
          >
            <h3 className="text-lg font-semibold text-blue-950 group-hover:text-blue-700">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm text-blue-900/70">{feature.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}