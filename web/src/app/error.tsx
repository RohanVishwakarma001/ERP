"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { StatusPage } from "@/components/layout/status-page";

/** Route-level error boundary: catches render errors in any page below the root layout. */
export default function RouteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    // Only in development: production consoles shouldn't carry stack traces or data.
    if (process.env.NODE_ENV !== "production") console.error(error);
  }, [error]);

  return (
    <StatusPage
      icon={<AlertTriangle />}
      title="Something went wrong"
      actions={
        <>
          <Button onClick={() => retry()} icon={<RotateCw className="w-4 h-4" />}>
            Try again
          </Button>
          <Link href="/" className={buttonClasses("secondary")}>
            Go to dashboard
          </Link>
        </>
      }
    >
      This page hit an unexpected error. Try again; if it keeps happening, contact IT support
      {error.digest ? (
        <>
          {" "}
          with reference <code className="font-mono text-slate-700">{error.digest}</code>
        </>
      ) : null}
      .
    </StatusPage>
  );
}
