import { FeeLedgerItem } from "@/types";

export const MOCK_FEES: FeeLedgerItem[] = [
  {
    id: "fee-sem6-tuition",
    category: "Tuition",
    amountDue: 58000,
    amountPaid: 58000,
    status: "PAID",
    dueDate: "2025-02-15",
    lastPaymentDate: "2025-02-10",
    transactionRef: "JBIT-PAY-2025-09824",
  },
  {
    id: "fee-sem6-exam",
    category: "Examination",
    amountDue: 4500,
    amountPaid: 4500,
    status: "PAID",
    dueDate: "2025-04-20",
    lastPaymentDate: "2025-04-18",
    transactionRef: "JBIT-PAY-2025-11048",
  },
  {
    id: "fee-sem6-hostel",
    category: "Hostel & Mess",
    amountDue: 38000,
    amountPaid: 38000,
    status: "PAID",
    dueDate: "2025-02-15",
    lastPaymentDate: "2025-02-12",
    transactionRef: "JBIT-PAY-2025-09941",
  },
  {
    id: "fee-sem6-bus",
    category: "Transport Bus",
    amountDue: 12000,
    amountPaid: 12000,
    status: "PAID",
    dueDate: "2025-02-15",
    lastPaymentDate: "2025-02-12",
    transactionRef: "JBIT-PAY-2025-09942",
  },
];
