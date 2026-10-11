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

export const feesApi = {
  mine: async (): Promise<MyFees> => (await httpClient.get("/fees/me")).data,
  ledger: async (): Promise<FeeLedgerRow[]> => (await httpClient.get("/fees")).data,
  createOrder: async (amount: number): Promise<PaymentOrder> => (await httpClient.post("/fees/orders", { amount })).data,
  verifyPayment: async (callback: RazorpayCallback): Promise<{ receiptNumber: string; message: string }> =>
    (await httpClient.post("/fees/verify", callback)).data,
};

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
