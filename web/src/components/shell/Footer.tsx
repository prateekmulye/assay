import { Github } from "lucide-react";

import { HealthDot } from "@/components/shell/HealthDot";

/**
 * Footer (DESIGN.md §8.1) — a quiet bench edge: single top hairline (a rule,
 * not a box), mono colophon with the graph provenance + model tiers, the
 * underlined source link (§3.3 link language), and a right-aligned mirror of
 * the health LED. The mirror is aria-hidden — the nav LED already announces.
 */
export function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--color-line)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-2xs text-[var(--color-fg-subtle)]">
          12-node multi-agent graph · router → analysts → debate → trader → risk
          → reporter · quick gpt-oss:20b / deep gpt-oss:120b
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/prateekmulye/FinResearchAI"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md font-mono text-2xs font-medium text-[var(--color-fg-muted)] underline decoration-[var(--color-line-strong)] underline-offset-4 transition-colors hover:text-[var(--color-fg)] hover:decoration-[var(--color-beam)]"
          >
            <Github className="size-3.5" aria-hidden="true" />
            <span>Source on GitHub</span>
          </a>
          <span aria-hidden="true">
            <HealthDot announce={false} />
          </span>
        </div>
      </div>
    </footer>
  );
}
