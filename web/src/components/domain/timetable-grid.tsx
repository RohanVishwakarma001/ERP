import { clsx } from "clsx";
import { DAY_CODES, type DayCode, type TimetableSlot } from "@/features/timetable";

const DAY_LABELS: Record<DayCode, string> = { MON: "Mon", TUE: "Tue", WED: "Wed", THU: "Thu", FRI: "Fri", SAT: "Sat" };

interface TimetableGridProps {
  slots: TimetableSlot[];
  /** Highlights today's column. */
  today?: DayCode | null;
  /** Show the section on each cell (useful when not filtered to one section). */
  showSection?: boolean;
}

/** Weekly day × period grid. Days with no classes are omitted. */
export function TimetableGrid({ slots, today, showSection = false }: TimetableGridProps) {
  const days = DAY_CODES.filter((d) => slots.some((s) => s.dayOfWeek === d));
  const periods = [...new Set(slots.map((s) => s.period))].sort((a, b) => a - b);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-separate border-spacing-1.5">
        <thead>
          <tr>
            <th className="text-left text-xs uppercase tracking-wider text-slate-400 font-semibold px-2">Period</th>
            {days.map((d) => (
              <th
                key={d}
                className={clsx(
                  "text-xs uppercase tracking-wider font-semibold px-2 py-1 rounded-lg",
                  d === today ? "bg-primary-container text-white" : "text-slate-500",
                )}
              >
                {DAY_LABELS[d]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((period) => (
            <tr key={period}>
              <td className="font-semibold text-slate-500 px-2 align-top pt-2">P{period}</td>
              {days.map((day) => {
                const cell = slots.filter((s) => s.dayOfWeek === day && s.period === period);
                return (
                  <td key={day} className="align-top min-w-[140px]">
                    {cell.map((s) => (
                      <div
                        key={s.id}
                        className={clsx(
                          "p-2 rounded-lg border mb-1",
                          s.status === "LIVE"
                            ? "border-emerald-300 bg-emerald-50"
                            : s.isLab
                              ? "border-surface-container-high bg-surface-container-low"
                              : "border-border-subtle bg-white",
                        )}
                      >
                        <p className="font-semibold text-slate-900">{s.subjectCode}</p>
                        <p className="text-xs text-slate-600 truncate">{s.subjectName}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {s.roomNumber} · {s.facultyName}
                          {showSection && ` · ${s.section}`}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">{s.time}</p>
                      </div>
                    ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
