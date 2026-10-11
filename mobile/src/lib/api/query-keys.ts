/** Every React Query cache key in the app; see web/src/lib/api/query-keys.ts for the convention. */
export const queryKeys = {
  attendance: {
    all: ['attendance'] as const,
    summary: ['attendance', 'summary'] as const,
    petitions: ['attendance', 'petitions'] as const,
  },
  timetable: {
    today: ['timetable', 'today'] as const,
    mine: ['timetable', 'me'] as const,
  },
  academics: {
    gradeCard: ['academics', 'grade-card'] as const,
    assignments: ['academics', 'assignments'] as const,
  },
  faculty: {
    todayClasses: ['faculty', 'classes', 'today'] as const,
    workload: ['faculty', 'workload'] as const,
    roster: (section?: string) => ['faculty', 'roster', section ?? 'all'] as const,
  },
  notices: ['notices'] as const,
  placement: { drives: ['placement', 'drives'] as const },
  notifications: ['notifications'] as const,
  complaints: ['complaints'] as const,
  staff: {
    executive: ['staff', 'executive-summary'] as const,
    libraryIssues: ['staff', 'library-issues'] as const,
    libraryBooks: (search: string) => ['staff', 'library-books', search] as const,
  },
} as const;
