/**
 * LibraryPage — query-param wiring, pagination math, and the loading / empty /
 * error / quota-exhausted states. The api client + quota hook are mocked; the
 * page is rendered through the shared Query + memory-router providers.
 */
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type * as ApiModuleNs from "@/lib/api";
import { renderWithProviders } from "@/test/render";

import { LibraryPage } from "./LibraryPage";

type ApiModule = typeof ApiModuleNs;

const library = vi.fn();
const quotaState = vi.fn();

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<ApiModule>();
  return { ...actual, api: { ...actual.api, library: (...a: unknown[]) => library(...a) } };
});

vi.mock("@/hooks/useQuota", () => ({
  useQuota: () => ({ quota: quotaState(), isLoading: false }),
}));

function makeRun(over: Record<string, unknown> = {}) {
  return {
    run_id: "run-1",
    ticker: "AAPL",
    debate_mode: "on",
    status: "finished",
    started_at: "2026-06-09T12:00:00Z",
    finished_at: "2026-06-09T12:00:10Z",
    final_decision: { action: "BUY", conviction: 0.8, score: 86, rationale: "x" },
    cost: {
      cost_usd: 0,
      latency_s: 3.3,
      prompt_tokens: 100,
      completion_tokens: 50,
      total_tokens: 150,
    },
    ...over,
  };
}

beforeEach(() => {
  library.mockReset();
  quotaState.mockReset().mockReturnValue({ kind: "available", remaining: 3, label: "" });
});

/** The pager readout's combined text ("N–M of T"), split across spans. */
function pagerText(): string {
  const prev = screen.getByRole("button", { name: /prev/i });
  // The readout <p> is the pager row's first child; the row contains Prev/Next.
  const row = prev.closest("div")?.parentElement;
  return row?.textContent ?? "";
}

describe("LibraryPage", () => {
  it("renders run rows with verdict + ticker from the API", async () => {
    library.mockResolvedValue({ runs: [makeRun()], total: 1 });
    renderWithProviders(<LibraryPage />, { route: "/library" });

    expect(await screen.findByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("BUY")).toBeInTheDocument();
    // Pager readout "1–1 of 1" — text is split across spans, match on the row.
    expect(pagerText()).toMatch(/1.*1.*of.*1/);
  });

  it("reads the ticker filter from the URL and passes it to the query", async () => {
    library.mockResolvedValue({ runs: [makeRun({ ticker: "NVDA" })], total: 1 });
    renderWithProviders(<LibraryPage />, { route: "/library?ticker=NVDA" });

    await screen.findByText("NVDA");
    // The input is prefilled and the query carried the ticker.
    expect(screen.getByDisplayValue("NVDA")).toBeInTheDocument();
    expect(library).toHaveBeenCalledWith(
      expect.objectContaining({ ticker: "NVDA", offset: 0, limit: 10 }),
      expect.anything(),
    );
  });

  it("computes the pager window and disables Prev on page 0", async () => {
    library.mockResolvedValue({ runs: [makeRun()], total: 25 });
    renderWithProviders(<LibraryPage />, { route: "/library" });

    await screen.findByText("AAPL");
    // 1–10 of 25 (text split across spans).
    expect(pagerText()).toMatch(/1.*10.*of.*25/);
    expect(screen.getByRole("button", { name: /prev/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).toBeEnabled();
  });

  it("maps page 1 to offset 10 and enables Prev (pagination math)", async () => {
    library.mockResolvedValue({ runs: [makeRun()], total: 25 });
    renderWithProviders(<LibraryPage />, { route: "/library?page=1" });
    await screen.findByText("AAPL");

    // page 1 -> offset 10 in the query; readout reads 11–20 of 25.
    expect(library).toHaveBeenCalledWith(
      expect.objectContaining({ offset: 10, limit: 10 }),
      expect.anything(),
    );
    expect(pagerText()).toMatch(/11.*20.*of.*25/);
    expect(screen.getByRole("button", { name: /prev/i })).toBeEnabled();
  });

  it("shows the empty state when there are no runs", async () => {
    library.mockResolvedValue({ runs: [], total: 0 });
    renderWithProviders(<LibraryPage />, { route: "/library" });
    expect(await screen.findByText(/no research yet/i)).toBeInTheDocument();
  });

  it("shows a filtered-empty variant when filters yield nothing", async () => {
    library.mockResolvedValue({ runs: [], total: 0 });
    renderWithProviders(<LibraryPage />, { route: "/library?ticker=ZZZZ" });
    expect(await screen.findByText(/no runs match those filters/i)).toBeInTheDocument();
  });

  it("shows an error state when the API rejects", async () => {
    library.mockRejectedValue(new Error("boom"));
    renderWithProviders(<LibraryPage />, { route: "/library" });
    expect(await screen.findByText(/couldn’t load the library/i)).toBeInTheDocument();
  });

  it("shows the quota-exhausted banner when live runs are spent", async () => {
    quotaState.mockReturnValue({ kind: "replay-only", label: "replay-only" });
    library.mockResolvedValue({ runs: [makeRun()], total: 1 });
    renderWithProviders(<LibraryPage />, { route: "/library" });
    expect(
      await screen.findByText(/live runs exhausted for today/i),
    ).toBeInTheDocument();
  });
});
