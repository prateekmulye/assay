/**
 * RunDetailPage — the designed 404 / dead-link state.
 *
 * Isolated in its own file ON PURPOSE: the query rejection here is an EXPECTED
 * one (a missing run id). The component's `isError` branch + the test client's
 * QueryCache.onError fully handle it, but when this test shares a file with the
 * player-mounting replay tests, the runner's file-scoped rejection tracker keeps
 * the file's event loop alive long enough to attribute the (handled) rejection
 * to this test and false-fail it. One expected-rejection test per file keeps it
 * the sole, fully-settled async — exactly how a designed error state should be
 * verified. The PipelineCanvas mock keeps xyflow out of the import path.
 */
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type * as ApiModuleNs from "@/lib/api";
import { renderWithProviders } from "@/test/render";

import { RunDetailPage } from "./RunDetailPage";

type ApiModule = typeof ApiModuleNs;

vi.mock("@/features/analyze/cockpit/PipelineCanvas", () => ({
  PipelineCanvas: () => <div data-testid="pipeline-canvas" />,
}));

const run = vi.fn();
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<ApiModule>();
  return { ...actual, api: { ...actual.api, run: (...a: unknown[]) => run(...a) } };
});

describe("RunDetailPage — missing run", () => {
  it("shows a designed 404 state with a route back to the library", async () => {
    // The page duck-types `.status` to detect a 404 (no retry, no crash).
    run.mockRejectedValue(Object.assign(new Error("not found"), { status: 404 }));
    renderWithProviders(<RunDetailPage />, {
      route: "/library/missing",
      path: "/library/:runId",
    });

    expect(await screen.findByText(/isn.t in the archive/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /browse the library/i }),
    ).toHaveAttribute("href", "/library");
  });
});
