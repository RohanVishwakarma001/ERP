"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { CopilotChat } from "@/components/domain/copilot-chat";

export default function AiCopilotPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        <PageHeader
          title="AI Campus Copilot"
          description="A rule-based assistant that answers from the signed-in user's own records. Personal questions (attendance, fees, classes) need a student account."
        />
        <CopilotChat />
      </div>
    </DashboardLayout>
  );
}
