"use client";

import { useState } from "react";
import Script from "next/script";
import { AlertCircle, CheckCircle2, CreditCard, Wallet } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState, QueryState } from "@/components/ui/query-state";
import { Stat, StatGrid, WelcomePanel } from "@/components/ui/welcome-panel";
import { RAZORPAY_CHECKOUT_SRC, useMyFees, useRazorpayCheckout, type FeeStatus } from "@/features/fees";
import { formatCurrency, formatDate } from "@/lib/format";

const STATUS_VARIANT: Record<FeeStatus, BadgeVariant> = { PAID: "success", PARTIAL: "info", PENDING: "warning", OVERDUE: "error" };

export default function StudentFeesPage() {
  const fees = useMyFees();
  const [scriptReady, setScriptReady] = useState(false);
  const checkout = useRazorpayCheckout(scriptReady);

  return (
    <DashboardLayout>
      <Script src={RAZORPAY_CHECKOUT_SRC} onLoad={() => setScriptReady(true)} />
      <div className="flex flex-col gap-6 max-w-3xl mx-auto">
        <PageHeader title="Fees & Payments" description="Your fee accounts, outstanding dues and payment history." />

        <QueryState query={fees}>
          {(f) => {
            // Payments are applied to the earliest-due account with a balance (mirrors the backend).
            const payable = f.accounts.find((a) => a.pendingAmount > 0);
            return (
              <>
                <WelcomePanel
                  headingLevel={2}
                  eyebrow={`${f.studentName} · ${f.rollNumber}`}
                  title={f.pendingDues > 0 ? formatCurrency(f.pendingDues) : "No dues"}
                  subtitle={f.pendingDues > 0 ? `Outstanding${f.nextDueDate ? ` · next due ${formatDate(f.nextDueDate)}` : ""}` : "All fee accounts are settled."}
                  actions={<Badge variant={f.clearanceStatus === "CLEARED" ? "success" : "warning"}>{f.clearanceStatus === "CLEARED" ? "Cleared" : "Dues pending"}</Badge>}
                >
                  <StatGrid columns={3}>
                    <Stat label="Total billed" value={formatCurrency(f.totalFee)} />
                    <Stat label="Paid" value={formatCurrency(f.paidFee)} tone="success" />
                    <Stat label="Outstanding" value={formatCurrency(f.pendingDues)} tone={f.pendingDues > 0 ? "warning" : "default"} />
                  </StatGrid>
                </WelcomePanel>

                {checkout.error && (
                  <p role="alert" className="p-4 bg-red-50 rounded-xl text-sm text-red-900 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {checkout.error}
                  </p>
                )}
                {checkout.receiptNumber && (
                  <p role="status" className="p-4 bg-emerald-50 rounded-xl text-sm text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> Payment successful. Receipt {checkout.receiptNumber}
                  </p>
                )}

                {payable && (
                  <Button size="lg" className="w-full" icon={<CreditCard className="w-4 h-4" />} loading={checkout.isPaying} onClick={() => checkout.pay(payable.pendingAmount)}>
                    Pay {formatCurrency(payable.pendingAmount)} for Semester {payable.semester}
                  </Button>
                )}

                {f.accounts.map((a) => (
                  <SectionCard
                    key={a.id}
                    title={`Semester ${a.semester} · ${a.academicYear}`}
                    subtitle={`Due ${formatDate(a.dueDate)}`}
                    action={<Badge variant={STATUS_VARIANT[a.status]}>{a.status}</Badge>}
                  >
                    <div className="divide-y divide-surface-subtle text-sm">
                      {a.breakdown.map((line) => (
                        <div key={line.title} className="py-2 flex items-center justify-between">
                          <span className="text-slate-700">{line.title}</span>
                          <span className="font-tabular-nums font-semibold">{formatCurrency(line.amount)}</span>
                        </div>
                      ))}
                      <div className="py-2 flex items-center justify-between text-xs text-slate-500">
                        <span>
                          Paid {formatCurrency(a.paidAmount)} of {formatCurrency(a.totalAmount)}
                        </span>
                        <span className="font-semibold text-slate-800">Balance {formatCurrency(a.pendingAmount)}</span>
                      </div>
                    </div>
                  </SectionCard>
                ))}

                <SectionCard title="Payment history" icon={<Wallet className="w-5 h-5" />}>
                  {f.recentTransactions.length === 0 ? (
                    <EmptyState compact icon={<Wallet />} title="No payments yet" />
                  ) : (
                    <div className="divide-y divide-surface-subtle">
                      {f.recentTransactions.map((t) => (
                        <div key={t.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                          <div>
                            <p className="font-semibold text-slate-800">{t.receiptNumber ?? "—"}</p>
                            <p className="text-slate-500">
                              {formatDate(t.date)} · {t.mode}
                            </p>
                          </div>
                          <span className="font-tabular-nums font-semibold text-slate-900">{formatCurrency(t.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              </>
            );
          }}
        </QueryState>
      </div>
    </DashboardLayout>
  );
}
