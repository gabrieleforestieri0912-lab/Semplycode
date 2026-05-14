"use client";

import { useEffect, useState } from "react";

export default function QuotaBadge() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/user/stats');
        if (!res.ok) return;
        const j = await res.json();
        if (mounted) setStats(j);
      } catch {}
    })();
    return () => (mounted = false);
  }, []);

  if (!stats) return null;

  const remaining = stats.remainingAnalyses == null ? '∞' : stats.remainingAnalyses;
  const plan = stats.plan || 'Gratuito';

  return (
    <div className="quota-badge text-xs text-white bg-primary/90 px-2 py-1 rounded">
      {plan} · {remaining} rimasti
    </div>
  );
}
