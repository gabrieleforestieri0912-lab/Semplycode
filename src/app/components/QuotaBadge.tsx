"use client";

import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface QuotaBadgeProps {
  className?: string;
}

export default function QuotaBadge({ className = "" }: QuotaBadgeProps) {
  const { data: stats, mutate } = useSWR("/api/usage/stats", fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 60000,
  });

  if (typeof window !== "undefined") {
    window.addEventListener("semplycode:stats:refresh", () => mutate());
  }

  if (!stats) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-[10px] text-gray-600 animate-pulse">...</span>
      </div>
    );
  }

  const remaining = stats.remainingAnalyses == null ? "∞" : stats.remainingAnalyses;
  const limit = stats.dailyLimit ?? "∞";
  const planLabel =
    stats.plan === "pro"
      ? "Pro"
      : stats.plan === "enterprise"
        ? "Enterprise"
        : stats.plan === "guest"
          ? "Ospite"
          : "Gratuito";

  return (
    <div
      className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${className}`}
    >
      <span className="text-gray-500">{planLabel}</span>
      <span className="text-primary">
        {remaining}/{limit} oggi
      </span>
      {stats.plan === "guest" && stats.remainingAnalyses === 0 && (
        <Link
          href="/register"
          className="text-primary underline normal-case tracking-normal"
        >
          Registrati
        </Link>
      )}
      {stats.plan === "free" && stats.remainingAnalyses === 0 && (
        <Link
          href="/#pricing"
          className="text-primary underline normal-case tracking-normal"
        >
          Pro
        </Link>
      )}
    </div>
  );
}
