"use client";

import { useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { SelectInput } from "@/components/ui/form-field";
import { QueryState } from "@/components/ui/query-state";
import { TimetableGrid } from "@/components/domain/timetable-grid";
import { todayDayCode, useTimetable } from "@/features/timetable";

export default function TimetablePage() {
  const timetable = useTimetable();
  const [section, setSection] = useState("ALL");

  const sections = useMemo(() => [...new Set((timetable.data ?? []).map((s) => s.section))].sort(), [timetable.data]);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          breadcrumbs={["Scheduling", "Timetable"]}
          title="Weekly Timetable"
          description="Every timetabled class by day and period. Classes running right now are highlighted."
          actions={
            <Button variant="secondary" icon={<FileDown className="w-4 h-4" />} onClick={() => window.print()}>
              Print
            </Button>
          }
        />

        <SectionCard
          title={section === "ALL" ? "All sections" : `Section ${section}`}
          action={
            <SelectInput aria-label="Filter by section" value={section} onChange={(e) => setSection(e.target.value)} className="sm:w-48">
              <option value="ALL">All sections</option>
              {sections.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </SelectInput>
          }
        >
          <QueryState query={timetable} empty={{ title: "No classes timetabled yet" }}>
            {(slots) => (
              <TimetableGrid
                slots={section === "ALL" ? slots : slots.filter((s) => s.section === section)}
                today={todayDayCode()}
                showSection={section === "ALL"}
              />
            )}
          </QueryState>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
