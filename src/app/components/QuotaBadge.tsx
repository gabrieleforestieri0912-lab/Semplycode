"use client";

import useSWR from "swr";
import Link from "next/link";
import { formatTokens } from "@/lib/tokenBudget";

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

  const remaining = stats.remainingTokens == null ? "∞" : formatTokens(stats.remainingTokens);
  const limit = stats.tokenLimit == null ? "∞" : formatTokens(stats.tokenLimit);
  const planLabel =
    stats.plan === "pro"
      ? "Pro"
      : stats.plan === "enterprise"
        ? "Enterprise"
        : stats.plan === "starter"
          ? "Starter"
          : stats.plan === "guest"
            ? "Ospite"
            : "Gratuito";

  const exhausted = stats.remainingTokens === 0;

  return (
    <div
      className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${className}`}
    >
      <span className="text-gray-500">{planLabel}</span>
      <span className="text-primary">
        {remaining}/{limit} {stats.plan === "guest" ? "oggi" : "al mese"}
      </span>
      {stats.plan === "guest" && exhausted && (
        <Link
          href="/register"
          className="text-primary underline normal-case tracking-normal"
        >
          Registrati
        </Link>
      )}
      {stats.plan !== "guest" && stats.plan !== "enterprise" && exhausted && (
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
