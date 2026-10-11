/**
 * Staff (non-teaching) experiences: administrators and librarians. Endpoints and
 * shapes match the web app (web/src/features/analytics, web/src/features/campus).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@/lib/api/http-client';
import { queryKeys } from '@/lib/api/query-keys';

/** GET /analytics/executive — ADMIN, ACCOUNTANT. */
export interface ExecutiveSummary {
  totalEnrolledStudents: number;
  activeFacultyCount: number;
  departmentsCount: number;
  overallCampusAttendance: number | null;
  debarredStudentsCount: number;
  feeCollectionRate: number | null;
  totalFeeCollected: number;
  totalFeeBilled: number;
  placementOffersCount: number;
}

/** GET /library/issues — LIBRARIAN, ADMIN. */
export interface LibraryLoan {
  id: string;
  bookTitle: string;
  barcode: string;
  studentName: string;
  rollNumber: string;
  issueDate: string;
  dueDate: string;
  overdueDays: number;
  accruedFine: number;
}

/** GET /library/books */
export interface CatalogueBook {
  id: string;
  isbn: string;
  title: string;
  authors: string[];
  shelfLocation: string | null;
  totalCopies: number;
  availableCopies: number;
}

export const staffApi = {
  executive: async (): Promise<ExecutiveSummary> => (await httpClient.get('/analytics/executive')).data,
  libraryIssues: async (): Promise<LibraryLoan[]> => (await httpClient.get('/library/issues')).data,
  libraryBooks: async (search: string): Promise<CatalogueBook[]> =>
    (await httpClient.get('/library/books', { params: search ? { search } : {} })).data,
  returnBook: async (issueId: string): Promise<{ fineAmount: number }> =>
    (await httpClient.post(`/library/return/${encodeURIComponent(issueId)}`)).data,
};

export const useExecutiveSummary = (enabled: boolean) =>
  useQuery({ queryKey: queryKeys.staff.executive, queryFn: staffApi.executive, enabled });

export const useLibraryLoans = (enabled: boolean) =>
  useQuery({ queryKey: queryKeys.staff.libraryIssues, queryFn: staffApi.libraryIssues, enabled });

export const useCatalogue = (search: string, enabled: boolean) =>
  useQuery({ queryKey: queryKeys.staff.libraryBooks(search), queryFn: () => staffApi.libraryBooks(search), enabled });

export function useReturnBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: staffApi.returnBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.libraryIssues });
      queryClient.invalidateQueries({ queryKey: ['staff', 'library-books'] });
    },
  });
}
