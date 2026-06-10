/* eslint-disable react-refresh/only-export-components -- test-only helpers; fast refresh is irrelevant here */
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import { type ReactNode } from "react";
import { MemoryRouter, Route, Routes, useRoutes } from "react-router";

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

/** Wrap a tree in Query + a memory router, for component-level tests.
 *
 *  Uses the DECLARATIVE MemoryRouter (not createMemoryRouter): the data router
 *  builds a `new Request(url, { signal })` per navigation, and under vitest's
 *  jsdom environment the global AbortController is jsdom's while Request is
 *  Node's undici — undici brand-rejects the foreign signal, so any <Link>
 *  click would explode. No test here uses loaders/actions, so the declarative
 *  router is behaviour-identical and navigation-safe. */
export function renderWithProviders(
  ui: ReactNode,
  options?: { route?: string; path?: string } & Omit<RenderOptions, "wrapper">,
) {
  // `path` lets a test mount the UI under a parametrized route (e.g.
  // "/library/:runId") so useParams resolves; defaults to a catch-all.
  return render(
    <QueryClientProvider client={testClient()}>
      <MemoryRouter initialEntries={[options?.route ?? "/"]}>
        <Routes>
          <Route path={options?.path ?? "*"} element={<>{ui}</>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
    options,
  );
}

type RouteObjects = Parameters<typeof useRoutes>[0];

/** Mount a RouteObject[] tree declaratively (see renderWithProviders). */
function RoutesFromObjects({ routes }: { routes: RouteObjects }) {
  return useRoutes(routes);
}

/** Render a full set of routes (for shell tests that need real navigation). */
export function renderRoutes(routes: RouteObjects, initialEntry = "/") {
  return render(
    <QueryClientProvider client={testClient()}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <RoutesFromObjects routes={routes} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
