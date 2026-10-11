import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/api/http-client";
import { queryKeys } from "@/lib/api/query-keys";

export type FeeStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";

/** GET /fees/me */
export interface MyFees {
  rollNumber: string;
  studentName: string;
  totalFee: number;
  paidFee: number;
  pendingDues: number;
  nextDueDate: string | null;
  clearanceStatus: "CLEARED" | "PENDING";
  accounts: {
    id: string;
    semester: number;
    academicYear: string;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    dueDate: string;
    status: FeeStatus;
    breakdown: { title: string; amount: number }[];
  }[];
  recentTransactions: {
    id: string;
    date: string;
    amount: number;
    receiptNumber: string | null;
    mode: string;
    status: string;
  }[];
}

/** GET /fees (finance) */
export interface FeeLedgerRow {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  semester: number;
  academicYear: string;
  amountDue: number;
  amountPaid: number;
  amountPending: number;
  status: FeeStatus;
  dueDate: string;
  lastPaymentDate: string | null;
  transactionRef: string | null;
}

export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface RazorpayCallback {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/** GET /fees/structures */
export interface FeeStructure {
  id: string;
  programId: string;
  programCode: string;
  programName: string;
  departmentCode: string;
  semester: number;
  academicYear: string;
  tuitionFee: number;
  developmentFee: number;
  labFee: number;
  libraryFee: number;
  examFee: number;
  totalAmount: number;
  studentsBilled: number;
  collected: number;
  outstanding: number;
}

export interface CreateFeeStructureInput {
  programId: string;
  semester: number;
  academicYear: string;
  tuitionFee: number;
  developmentFee?: number;
  labFee?: number;
  libraryFee?: number;
  examFee?: number;
}

export const OFFLINE_PAYMENT_MODES = ["CASH", "CHEQUE", "DEMAND_DRAFT", "BANK_TRANSFER", "UPI"] as const;
export type OfflinePaymentMode = (typeof OFFLINE_PAYMENT_MODES)[number];

export const feesApi = {
  mine: async (): Promise<MyFees> => (await httpClient.get("/fees/me")).data,
  ledger: async (): Promise<FeeLedgerRow[]> => (await httpClient.get("/fees")).data,
  createOrder: async (amount: number): Promise<PaymentOrder> => (await httpClient.post("/fees/orders", { amount })).data,
  verifyPayment: async (callback: RazorpayCallback): Promise<{ receiptNumber: string; message: string }> =>
    (await httpClient.post("/fees/verify", callback)).data,
  structures: async (): Promise<FeeStructure[]> => (await httpClient.get("/fees/structures")).data,
  createStructure: async (input: CreateFeeStructureInput): Promise<FeeStructure[]> => (await httpClient.post("/fees/structures", input)).data,
  deleteStructure: async (id: string): Promise<FeeStructure[]> => (await httpClient.delete(`/fees/structures/${id}`)).data,
  assignStructure: async ({ id, dueDate }: { id: string; dueDate: string }): Promise<{ billed: number; alreadyBilled: number; eligible: number }> =>
    (await httpClient.post(`/fees/structures/${id}/assign`, { dueDate })).data,
  recordPayment: async ({ accountId, ...input }: { accountId: string; amount: number; mode: OfflinePaymentMode; reference?: string }) =>
    (await httpClient.post<{ receiptNumber: string; pendingAmount: number }>(`/fees/accounts/${accountId}/payments`, input)).data,
};

function useFeesMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fees.all });
      // Fee status gates admit cards.
      queryClient.invalidateQueries({ queryKey: queryKeys.admitCards.all });
    },
  });
}

export function useFeeStructures() {
  return useQuery({ queryKey: queryKeys.fees.structures, queryFn: feesApi.structures });
}

export const useCreateFeeStructure = () => useFeesMutation(feesApi.createStructure);
export const useDeleteFeeStructure = () => useFeesMutation(feesApi.deleteStructure);
export const useAssignFeeStructure = () => useFeesMutation(feesApi.assignStructure);
export const useRecordPayment = () => useFeesMutation(feesApi.recordPayment);

export function useMyFees() {
  return useQuery({ queryKey: queryKeys.fees.mine, queryFn: feesApi.mine });
}

export function useFeeLedger() {
  return useQuery({ queryKey: queryKeys.fees.ledger, queryFn: feesApi.ledger });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: feesApi.verifyPayment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.fees.all }),
  });
}
