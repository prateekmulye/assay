import { Compass } from "lucide-react";
import { Link } from "react-router";

import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * NotFoundPage — §8.8 empty-state language: the instrument at rest, outcome-
 * oriented copy (what to do next), one key CTA. Never "Page not found."
 */
export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-2xl pt-8">
      <EmptyState
        icon={Compass}
        badge="404 · unmapped address"
        title="Nothing is wired to this route"
        description="This address doesn't reach any surface on the instrument. The bench is on Analyze — run a ticker and the whole pipeline lights up from there."
      >
        <Link to="/" className={buttonVariants({ variant: "key" })}>
          Back to Analyze
        </Link>
      </EmptyState>
    </div>
  );
}
