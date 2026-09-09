import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import type { LlmUsageSummary } from '../types';

/** Small, real (not estimated) running total of what the LLM has actually cost. */
export function UsageBadge() {
  const [usage, setUsage] = useState<LlmUsageSummary | null>(null);

  useEffect(() => {
    api.getLlmUsage().then(setUsage).catch(() => setUsage(null));
  }, []);

  if (!usage || usage.classifiedMessageCount === 0) return null;

  return (
    <span
      className="hidden items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:inline-flex"
      title={`${usage.classifiedMessageCount} classified messages · ${usage.totalInputTokens.toLocaleString()} in / ${usage.totalOutputTokens.toLocaleString()} out tokens`}
    >
      <Sparkles size={12} />
      LLM spend: ${usage.totalCostUsd.toFixed(4)}
    </span>
  );
}
