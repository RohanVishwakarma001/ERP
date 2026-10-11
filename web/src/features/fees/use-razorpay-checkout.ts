"use client";

import { useCallback, useState } from "react";
import { getErrorMessage } from "@/lib/api/api-error";
import { feesApi, useVerifyPayment, type RazorpayCallback } from "./api";

/** Minimal typing for the Razorpay Checkout global injected by checkout.js. */
interface RazorpayInstance {
  open(): void;
  on(event: "payment.failed", handler: (response: { error?: { description?: string } }) => void): void;
}
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

export const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

/**
 * Drives one Razorpay payment: create order → open Checkout → verify the
 * signature server-side. Exposes a single `pay(amount)` and its status.
 * Load `RAZORPAY_CHECKOUT_SRC` with next/script and pass `scriptReady`.
 */
export function useRazorpayCheckout(scriptReady: boolean) {
  const verify = useVerifyPayment();
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);

  const pay = useCallback(
    async (amount: number) => {
      setError(null);
      setReceiptNumber(null);
      if (!scriptReady || !window.Razorpay) {
        setError("The payment gateway is still loading. Please try again in a moment.");
        return;
      }

      setIsPaying(true);
      try {
        const order = await feesApi.createOrder(amount);
        const checkout = new window.Razorpay({
          key: order.keyId,
          amount: Math.round(order.amount * 100),
          currency: order.currency,
          order_id: order.orderId,
          name: "JBIT Dehradun — Campus ERP",
          description: "Semester fee payment",
          theme: { color: "#0b3b60" },
          handler: (response: RazorpayCallback) =>
            verify.mutate(response, {
              onSuccess: (result) => setReceiptNumber(result.receiptNumber),
              onError: () =>
                setError("We couldn't verify this payment. If your account was debited, contact Finance & Accounts with your bank reference."),
              onSettled: () => setIsPaying(false),
            }),
          modal: { ondismiss: () => setIsPaying(false) },
        });
        checkout.on("payment.failed", (response) => {
          setError(response?.error?.description || "Payment failed. Please try again.");
          setIsPaying(false);
        });
        checkout.open();
      } catch (err) {
        setError(getErrorMessage(err));
        setIsPaying(false);
      }
    },
    [scriptReady, verify],
  );

  return { pay, isPaying, error, receiptNumber };
}
