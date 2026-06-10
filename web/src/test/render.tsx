import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import { type ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";

/** A query client with retries off so tests fail fast and deterministically.
 *  A no-op cache onError marks query rejections as handled, so an expected
 *  error-path test (e.g. a 404) doesn't trip the runner's unhandled-rejection
 *  detector — the rendered error UI is still asserted normally. */
function testClient() {
  return new QueryClient({
    queryCache: new QueryCache({ onError: () => {} }),
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: Infinity },
    },
  });
}

/** Wrap a tree in Query + a memory router, for component-level tests. */
export function renderWithProviders(
  ui: ReactNode,
  options?: { route?: string; path?: string } & Omit<RenderOptions, "wrapper">,
) {
  // `path` lets a test mount the UI under a parametrized route (e.g.
  // "/library/:runId") so useParams resolves; defaults to a catch-all.
  const router = createMemoryRouter(
    [{ path: options?.path ?? "*", element: <>{ui}</> }],
    { initialEntries: [options?.route ?? "/"] },
  );
  return render(
    <QueryClientProvider client={testClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
    options,
  );
}

/** Render a full set of routes (for shell tests that need real navigation). */
export function renderRoutes(
  routes: Parameters<typeof createMemoryRouter>[0],
  initialEntry = "/",
) {
  const router = createMemoryRouter(routes, { initialEntries: [initialEntry] });
  return render(
    <QueryClientProvider client={testClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}
