/** Campus operations: hostels, transport, library and grievances. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/api/http-client";
import { queryKeys } from "@/lib/api/query-keys";
import { toApiError } from "@/lib/api/api-error";

/** GET /library/issues — librarian desk view of books currently on loan. */
export interface LibraryIssue {
  id: string;
  bookTitle: string;
  isbn: string;
  barcode: string;
  studentName: string;
  rollNumber: string;
  issueDate: string;
  dueDate: string;
  overdueDays: number;
  accruedFine: number;
}

/** POST /library/issue */
export interface IssuedBook {
  issueId: string;
  bookTitle: string;
  barcode: string;
  dueDate: string;
}

/** GET /hostel */
export interface HostelBuilding {
  id: string;
  name: string;
  gender: string;
  floors: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
}

/** GET /hostel/rooms */
export interface HostelBed {
  id: string;
  buildingName: string;
  roomNumber: string;
  floor: number;
  bedNumber: string;
  studentName: string | null;
  studentRoll: string | null;
  studentBranch: string | null;
  status: "OCCUPIED" | "VACANT";
}

/** GET /transport/routes */
export interface BusRoute {
  id: string;
  routeNumber: string;
  routeTitle: string;
  stops: string[];
  departureTime: string;
  busNumber: string;
  driverName: string;
  driverPhone: string;
  capacity: number;
  passHolders: number;
  currentPosition: { lat: number; lng: number; at: string } | null;
  status: "ON_ROUTE" | "NO_GPS_SIGNAL";
}

/** GET /library/books */
export interface LibraryBook {
  id: string;
  isbn: string;
  title: string;
  authors: string[];
  publisher: string | null;
  category: string;
  shelfLocation: string | null;
  totalCopies: number;
  availableCopies: number;
}

/** GET /complaints */
export interface Complaint {
  id: string;
  ticketNumber: string;
  title: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  description: string;
  reportedBy: string;
  status: "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  assignedTo: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  comments: { author: string; text: string; time: string }[];
}

/** GET /transport/my-pass (404 when the student has no pass). */
export interface MyBusPass {
  passNumber: string;
  routeNumber: string;
  routeTitle: string;
  designatedStop: string;
  departureTime: string;
  validUntil: string;
  isValid: boolean;
  busNumber: string;
  driverName: string;
  driverPhone: string;
}

export const campusApi = {
  /** Resolves `null` instead of throwing when the student has no pass. */
  myBusPass: async (): Promise<MyBusPass | null> => {
    try {
      return (await httpClient.get("/transport/my-pass")).data;
    } catch (err) {
      if (toApiError(err).status === 404) return null;
      throw err;
    }
  },
  hostels: async (): Promise<HostelBuilding[]> => (await httpClient.get("/hostel")).data,
  hostelBeds: async (): Promise<HostelBed[]> => (await httpClient.get("/hostel/rooms")).data,
  transportRoutes: async (): Promise<BusRoute[]> => (await httpClient.get("/transport/routes")).data,
  libraryBooks: async (search?: string): Promise<LibraryBook[]> =>
    (await httpClient.get("/library/books", { params: search ? { search } : {} })).data,
  complaints: async (): Promise<Complaint[]> => (await httpClient.get("/complaints")).data,
  libraryIssues: async (): Promise<LibraryIssue[]> => (await httpClient.get("/library/issues")).data,
  issueBook: async (input: { studentId: string; bookId: string }): Promise<IssuedBook> =>
    (await httpClient.post("/library/issue", input)).data,
  returnBook: async (issueId: string): Promise<{ issueId: string; returnedAt: string; fineAmount: number }> =>
    (await httpClient.post(`/library/return/${encodeURIComponent(issueId)}`)).data,
};

export const useHostels = () => useQuery({ queryKey: queryKeys.campus.hostels, queryFn: campusApi.hostels });
export const useHostelBeds = () => useQuery({ queryKey: queryKeys.campus.hostelBeds, queryFn: campusApi.hostelBeds });
export const useTransportRoutes = () =>
  useQuery({ queryKey: queryKeys.campus.transportRoutes, queryFn: campusApi.transportRoutes });
export const useLibraryBooks = (search = "") =>
  useQuery({ queryKey: queryKeys.campus.libraryBooks(search), queryFn: () => campusApi.libraryBooks(search) });
export const useComplaints = () => useQuery({ queryKey: queryKeys.campus.complaints, queryFn: campusApi.complaints });
export const useMyBusPass = () => useQuery({ queryKey: queryKeys.campus.myBusPass, queryFn: campusApi.myBusPass });

export const useLibraryIssues = () => useQuery({ queryKey: queryKeys.campus.libraryIssues, queryFn: campusApi.libraryIssues });

/** Issue/return change both the loan list and copy availability in the catalogue. */
function useLibraryMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campus.libraryIssues });
      queryClient.invalidateQueries({ queryKey: ["campus", "library-books"] });
    },
  });
}

export const useIssueBook = () => useLibraryMutation(campusApi.issueBook);
export const useReturnBook = () => useLibraryMutation(campusApi.returnBook);
