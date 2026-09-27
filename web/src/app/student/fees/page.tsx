"use client";

import React, { useState } from "react";
import Script from "next/script";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { feeService } from "@/services/domain-services";
import { CreditCard, CheckCircle2, AlertCircle, Wallet } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function StudentFeesPage() {
  const queryClient = useQueryClient();
  const [isRazorpayReady, setIsRazorpayReady] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [lastReceipt, setLastReceipt] = useState<string | null>(null);

  const { data: fees, isLoading } = useQuery({
    queryKey: ["myFees"],
    queryFn: feeService.getMyFees,
  });

  const handlePayNow = async () => {
    if (!fees?.pendingDues || fees.pendingDues <= 0) return;
    setPayError(null);
    setIsPaying(true);

    try {
      const order = await feeService.createOrder(fees.pendingDues);

      if (!isRazorpayReady || !window.Razorpay) {
        throw new Error("Payment gateway script has not loaded yet. Please try again in a moment.");
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: Math.round(order.amount * 100),
        currency: order.currency,
        order_id: order.orderId,
        name: "JBIT Dehradun — Campus ERP",
        description: "Semester Fee Payment",
        theme: { color: "#0B3B60" },
        handler: async (response: any) => {
          try {
            const result = await feeService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setLastReceipt(result.receiptNumber);
            queryClient.invalidateQueries({ queryKey: ["myFees"] });
          } catch (err: any) {
            setPayError(err?.response?.data?.error?.message || "Payment verification failed. Contact Finance & Accounts if your account was debited.");
          } finally {
            setIsPaying(false);
          }
        },
        modal: {
          ondismiss: () => setIsPaying(false),
        },
      });

      rzp.on("payment.failed", (resp: any) => {
        setPayError(resp?.error?.description || "Payment failed. Please try again.");
        setIsPaying(false);
      });

      rzp.open();
    } catch (err: any) {
      setPayError(
        err?.response?.data?.error?.message || err.message || "Unable to start payment. The payment gateway may not be configured yet."
      );
      setIsPaying(false);
    }
  };

  return (
    <DashboardLayout role="STUDENT">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setIsRazorpayReady(true)}
      />
      <div className="flex flex-col gap-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-headline">Fee Ledger &amp; Payments</h1>
          <p className="text-xs text-slate-500 mt-1">Semester dues, payment history, and digital receipts.</p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading fee ledger...</div>
        ) : (
          <>
            <div className="p-6 rounded-2xl bg-[#0B3B60] text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <span className="text-[11px] uppercase font-bold text-sky-200 tracking-wider">
                  {fees?.studentName} • Roll #{fees?.rollNumber}
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold font-tabular-nums">₹{fees?.pendingDues?.toLocaleString("en-IN") ?? 0}</span>
                  <span className="text-xs text-sky-200">Pending Dues</span>
                </div>
              </div>
              <Badge variant={fees?.clearanceStatus === "CLEARED" ? "success" : "warning"}>
                {fees?.clearanceStatus}
              </Badge>
            </div>

            {payError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{payError}</span>
              </div>
            )}

            {lastReceipt && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Payment successful. Receipt: {lastReceipt}</span>
              </div>
            )}

            {fees?.pendingDues > 0 && (
              <button
                type="button"
                onClick={handlePayNow}
                disabled={isPaying}
                className="w-full py-3.5 rounded-xl bg-[#0B3B60] hover:bg-[#082C49] text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                {isPaying ? "Processing..." : `Pay ₹${fees.pendingDues.toLocaleString("en-IN")} Now`}
              </button>
            )}

            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Fee Breakdown</h2>
              <div className="rounded-xl border border-[#E2E8F0] bg-white divide-y divide-[#F1F5F9]">
                {fees?.breakdown?.map((item: any, idx: number) => (
                  <div key={idx} className="p-4 flex items-center justify-between text-sm">
                    <span className="text-slate-700">{item.title}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-tabular-nums font-semibold">₹{item.amount?.toLocaleString("en-IN")}</span>
                      <Badge variant={item.status === "PAID" ? "success" : "warning"}>{item.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Wallet className="w-4 h-4" /> Payment History
              </h2>
              <div className="rounded-xl border border-[#E2E8F0] bg-white divide-y divide-[#F1F5F9]">
                {fees?.recentTransactions?.length ? (
                  fees.recentTransactions.map((txn: any) => (
                    <div key={txn.id} className="p-4 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-800">{txn.receiptNumber}</p>
                        <p className="text-slate-500">{txn.date} • {txn.mode}</p>
                      </div>
                      <span className="font-tabular-nums font-bold text-emerald-600">
                        ₹{txn.amount?.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400">No payment history yet.</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
