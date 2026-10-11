/**
 * Every React Query cache key in the app. Centralised so that a mutation can
 * invalidate exactly the queries it affects, and so two screens reading the same
 * data share one cache entry instead of drifting apart under different keys.
 *
 * Convention: `[domain, scope, ...params]`. Invalidating `[domain]` clears all of it.
 */
export const queryKeys = {
  students: {
    all: ["students"] as const,
    list: (filters: Record<string, unknown> = {}) => ["students", "list", filters] as const,
    me: ["students", "me"] as const,
  },
  faculty: {
    all: ["faculty"] as const,
    list: ["faculty", "list"] as const,
    me: ["faculty", "me"] as const,
    todayClasses: ["faculty", "classes", "today"] as const,
  },
  departments: {
    all: ["departments"] as const,
    list: ["departments", "list"] as const,
    curriculum: ["departments", "curriculum"] as const,
    programs: ["departments", "programs"] as const,
    sections: ["departments", "sections"] as const,
  },
  users: {
    all: ["users"] as const,
    list: (filters: Record<string, unknown> = {}) => ["users", "list", filters] as const,
  },
  attendance: {
    all: ["attendance"] as const,
    mySubjects: ["attendance", "me", "subjects"] as const,
    myPetitions: ["attendance", "me", "petitions"] as const,
    pendingCorrections: ["attendance", "corrections"] as const,
  },
  timetable: {
    all: ["timetable"] as const,
    list: (filters: Record<string, unknown> = {}) => ["timetable", "list", filters] as const,
    mine: ["timetable", "me"] as const,
    today: ["timetable", "today"] as const,
  },
  exams: {
    all: ["exams"] as const,
    cycles: ["exams", "cycles"] as const,
    schedule: ["exams", "schedule"] as const,
    seating: ["exams", "seating"] as const,
    myGradeCard: ["exams", "grade-card", "me"] as const,
  },
  placement: {
    all: ["placement"] as const,
    drives: ["placement", "drives"] as const,
    applications: ["placement", "applications"] as const,
  },
  fees: {
    all: ["fees"] as const,
    ledger: ["fees", "ledger"] as const,
    mine: ["fees", "me"] as const,
  },
  notices: {
    all: ["notices"] as const,
    list: ["notices", "list"] as const,
  },
  campus: {
    hostels: ["campus", "hostels"] as const,
    hostelBeds: ["campus", "hostel-beds"] as const,
    transportRoutes: ["campus", "transport-routes"] as const,
    libraryBooks: (search = "") => ["campus", "library-books", search] as const,
    libraryIssues: ["campus", "library-issues"] as const,
    complaints: ["campus", "complaints"] as const,
    myBusPass: ["campus", "bus-pass", "me"] as const,
  },
  analytics: {
    executive: ["analytics", "executive"] as const,
    department: (code: string) => ["analytics", "department", code] as const,
  },
} as const;
