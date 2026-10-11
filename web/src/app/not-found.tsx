import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { StatusPage } from "@/components/layout/status-page";

export default function NotFound() {
  return (
    <StatusPage
      code="Error 404"
      icon={<Compass />}
      title="Page not found"
      actions={
        <Link href="/" className={buttonClasses("primary")}>
          Back to my dashboard
        </Link>
      }
    >
      The page you&apos;re looking for doesn&apos;t exist or has moved.
    </StatusPage>
  );
}
