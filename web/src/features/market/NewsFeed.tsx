/**
 * NewsFeed — the newest-first headlines the news analyst ingests, as ONE
 * graphite panel of hairline-divided rows (§8.14: rules, not boxes — the tile
 * pile is gone). Each row is a whole-row link OUT to the article (new tab,
 * rel=noopener — it leaves the app): source + relative time eyebrow, title,
 * snippet. Row hover steps the luminance (surface-1 → surface-2). Empty → an
 * outcome-oriented nudge.
 */
import { ArrowUpRight, Newspaper } from "lucide-react";
import { Link } from "react-router";

import { buttonVariants } from "@/components/ui/button";
import type { NewsItem } from "@/lib/api";
import { cn, formatRelativeTime } from "@/lib/utils";

function NewsRow({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${item.title} (opens in a new tab)`}
      className="group -mx-2 block rounded-md px-2 py-3 transition-colors duration-[180ms] ease-[var(--ease-out)] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[var(--color-beam)] hover:bg-[var(--color-surface-2)]"
    >
      <div className="mb-1 flex items-center gap-2 font-mono text-2xs text-[var(--color-fg-subtle)]">
        <span className="truncate uppercase tracking-wide text-[var(--color-fg-muted)]">
          {item.source ?? "source"}
        </span>
        <span aria-hidden="true">·</span>
        <span className="tabular-nums">{formatRelativeTime(item.ts)}</span>
        <ArrowUpRight
          className="ml-auto size-3.5 text-[var(--color-fg-subtle)] transition-[transform,color] duration-[180ms] ease-[var(--ease-out)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-fg)]"
          aria-hidden="true"
        />
      </div>
      <h3 className="text-sm font-medium leading-snug text-[var(--color-fg)]">
        {item.title}
      </h3>
      {item.snippet && (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--color-fg-muted)]">
          {item.snippet}
        </p>
      )}
    </a>
  );
}

export function NewsFeed({
  ticker,
  items,
  isLoading,
  className,
}: {
  ticker: string;
  items: NewsItem[];
  isLoading: boolean;
  className?: string;
}) {
  return (
    <section className={cn("panel space-y-3 p-5 sm:p-6", className)}>
      <p className="kicker flex items-center gap-2">
        <Newspaper className="size-3.5" aria-hidden="true" />
        News the analysts ingest
      </p>

      {isLoading ? (
        <ul className="space-y-2" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <li
              key={i}
              className="animate-shimmer h-16 rounded-sm bg-[var(--color-surface-2)]"
            />
          ))}
        </ul>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2.5 px-5 py-8 text-center">
          <span className="flex items-center gap-2" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-1 rounded-full bg-[var(--color-fg-subtle)] opacity-30"
              />
            ))}
          </span>
          <p className="text-sm font-medium text-[var(--color-fg)]">
            No headlines stored yet
          </p>
          <p className="max-w-xs text-xs leading-relaxed text-[var(--color-fg-muted)]">
            The news analyst pulls and stores headlines for {ticker} on its first
            run — they’ll appear here newest-first.
          </p>
          <Link
            to="/"
            state={{ ticker }}
            className={cn(buttonVariants({ variant: "rail", size: "sm" }), "mt-1")}
          >
            Analyze {ticker}
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--color-line)]">
          {items.map((item, i) => (
            <li key={`${item.url}:${i}`}>
              <NewsRow item={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
