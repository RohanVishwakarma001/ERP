"use client";

import { useDeferredValue, useState, type FormEvent } from "react";
import { AlertTriangle, BookCopy, BookOpen, BookUp, Library, Search, Undo2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Modal, ModalActions } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Field, TextInput } from "@/components/ui/form-field";
import { ErrorState } from "@/components/ui/query-state";
import { DataTable, type Column } from "@/components/ui/data-table";
import { useIssueBook, useLibraryBooks, useLibraryIssues, useReturnBook, type LibraryBook, type LibraryIssue } from "@/features/campus";
import { useStudents } from "@/features/students";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "@/lib/toast-store";

type Tab = "loans" | "catalogue";

const bookColumns: Column<LibraryBook>[] = [
  {
    header: "Title",
    accessorKey: "title",
    sortable: true,
    cell: (b) => (
      <div className="min-w-0">
        <span className="font-medium text-slate-900 block">{b.title}</span>
        <span className="text-xs text-slate-500 font-mono">ISBN {b.isbn}</span>
      </div>
    ),
  },
  { header: "Authors", cell: (b) => <span className="text-slate-700">{b.authors.join(", ")}</span> },
  { header: "Category", accessorKey: "category", sortable: true },
  {
    header: "Available",
    accessorKey: "availableCopies",
    sortable: true,
    cell: (b) => (
      <Badge variant={b.availableCopies > 0 ? "success" : "error"}>
        {b.availableCopies} of {b.totalCopies} {b.availableCopies > 0 ? "available" : "· all on loan"}
      </Badge>
    ),
  },
  { header: "Shelf", accessorKey: "shelfLocation", cell: (b) => <span className="font-mono text-slate-600">{b.shelfLocation ?? "—"}</span> },
];

/** Library desk — shared by /library/dashboard and /admin/library. */
export function LibraryScreen() {
  const books = useLibraryBooks();
  const issues = useLibraryIssues();
  const returnBook = useReturnBook();
  const [tab, setTab] = useState<Tab>("loans");
  const [issueOpen, setIssueOpen] = useState(false);
  const [returning, setReturning] = useState<LibraryIssue | null>(null);

  const list = books.data ?? [];
  const loans = issues.data ?? [];
  const totalCopies = list.reduce((n, b) => n + b.totalCopies, 0);
  const available = list.reduce((n, b) => n + b.availableCopies, 0);
  const overdue = loans.filter((l) => l.overdueDays > 0);

  const confirmReturn = () => {
    if (!returning) return;
    returnBook.mutate(returning.id, {
      onSuccess: (res) => {
        toast.success(
          res.fineAmount > 0 ? `"${returning.bookTitle}" returned. Fine recorded: ${formatCurrency(res.fineAmount)}.` : `"${returning.bookTitle}" returned.`,
        );
        setReturning(null);
      },
      onError: () => setReturning(null),
    });
  };

  const loanColumns: Column<LibraryIssue>[] = [
    {
      header: "Book",
      accessorKey: "bookTitle",
      sortable: true,
      cell: (l) => (
        <div className="min-w-0">
          <span className="font-medium text-slate-900 block">{l.bookTitle}</span>
          <span className="text-xs text-slate-500 font-mono">Copy {l.barcode}</span>
        </div>
      ),
    },
    {
      header: "Borrower",
      accessorKey: "studentName",
      sortable: true,
      cell: (l) => (
        <div>
          <span className="text-slate-900 block">{l.studentName}</span>
          <span className="text-xs text-slate-500 font-mono">{l.rollNumber}</span>
        </div>
      ),
    },
    { header: "Issued", accessorKey: "issueDate", sortable: true, cell: (l) => formatDate(l.issueDate) },
    {
      header: "Due",
      accessorKey: "dueDate",
      sortable: true,
      cell: (l) =>
        l.overdueDays > 0 ? (
          <div>
            <Badge variant="error">
              {l.overdueDays} day{l.overdueDays > 1 ? "s" : ""} overdue
            </Badge>
            <span className="block text-xs text-slate-500 mt-1">
              Due {formatDate(l.dueDate)} · Fine {formatCurrency(l.accruedFine)}
            </span>
          </div>
        ) : (
          <span className="text-slate-700">{formatDate(l.dueDate)}</span>
        ),
    },
    {
      header: "",
      cell: (l) => (
        <Button size="sm" variant="secondary" icon={<Undo2 className="w-4 h-4" />} onClick={() => setReturning(l)} aria-label={`Return ${l.bookTitle} from ${l.studentName}`}>
          Return
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          breadcrumbs={["Campus operations", "Library"]}
          title="Central Library"
          description="Issue and return books, track overdue loans and browse the catalogue with live copy availability."
          actions={
            <Button icon={<BookUp className="w-4 h-4" />} onClick={() => setIssueOpen(true)}>
              Issue a book
            </Button>
          }
        />

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard title="Titles" value={books.isPending ? "—" : list.length} icon={<Library />} footerLeft={`${totalCopies} copies in total`} />
          <KpiCard title="Available copies" value={books.isPending ? "—" : available} icon={<BookOpen />} />
          <KpiCard title="On loan" value={issues.isPending ? "—" : loans.length} icon={<BookCopy />} />
          <KpiCard
            title="Overdue"
            value={issues.isPending ? "—" : overdue.length}
            icon={<AlertTriangle />}
            footerLeft={overdue.length ? `${formatCurrency(overdue.reduce((n, l) => n + l.accruedFine, 0))} in fines accrued` : "Nothing overdue"}
            footerRightColor="warning"
          />
        </div>

        <div className="max-w-sm">
          <SegmentedControl<Tab>
            label="Library views"
            value={tab}
            onChange={setTab}
            options={[
              { value: "loans", label: `Loans${loans.length ? ` (${loans.length})` : ""}` },
              { value: "catalogue", label: "Catalogue" },
            ]}
          />
        </div>

        {tab === "loans" &&
          (issues.isError ? (
            <ErrorState error={issues.error} onRetry={() => issues.refetch()} />
          ) : (
            <DataTable
              caption="Books currently on loan"
              data={loans}
              columns={loanColumns}
              searchPlaceholder="Search by book, student or roll number…"
              pageSize={10}
              isLoading={issues.isPending}
              emptyMessage="No books on loan"
              emptySubMessage="Issued books will appear here until they're returned."
              exportFileName="jbit-library-loans"
            />
          ))}

        {tab === "catalogue" &&
          (books.isError ? (
            <ErrorState error={books.error} onRetry={() => books.refetch()} />
          ) : (
            <DataTable
              caption="Library catalogue"
              data={list}
              columns={bookColumns}
              searchPlaceholder="Search titles, authors, ISBN…"
              pageSize={12}
              isLoading={books.isPending}
              exportFileName="jbit-library-catalogue"
            />
          ))}
      </div>

      {issueOpen && <IssueBookDialog books={list} onClose={() => setIssueOpen(false)} />}

      <ConfirmDialog
        open={returning !== null}
        title="Confirm return"
        confirmLabel="Record return"
        loading={returnBook.isPending}
        onCancel={() => setReturning(null)}
        onConfirm={confirmReturn}
        message={
          returning && (
            <>
              Return <strong className="font-semibold text-slate-900">{returning.bookTitle}</strong> (copy {returning.barcode}) from {returning.studentName} (
              {returning.rollNumber})?
              {returning.overdueDays > 0 && (
                <span className="block mt-3 p-3 rounded-xl bg-amber-50 text-amber-900">
                  This book is {returning.overdueDays} day{returning.overdueDays > 1 ? "s" : ""} overdue. A fine of about{" "}
                  <strong>{formatCurrency(returning.accruedFine)}</strong> will be recorded.
                </span>
              )}
            </>
          )
        }
      />
    </DashboardLayout>
  );
}

function IssueBookDialog({ books, onClose }: { books: LibraryBook[]; onClose: () => void }) {
  const issueBook = useIssueBook();
  const [studentQuery, setStudentQuery] = useState("");
  const [bookQuery, setBookQuery] = useState("");
  const [studentId, setStudentId] = useState<string | null>(null);
  const [bookId, setBookId] = useState<string | null>(null);

  // Defer so typing stays responsive; only query the roster from 3 characters.
  const deferredStudentQuery = useDeferredValue(studentQuery.trim());
  const canSearch = deferredStudentQuery.length >= 3;
  const students = useStudents({ search: deferredStudentQuery }, { enabled: canSearch });
  const studentMatches = canSearch ? (students.data ?? []).slice(0, 6) : [];
  const selectedStudent = students.data?.find((s) => s.id === studentId);

  const q = bookQuery.trim().toLowerCase();
  const bookMatches = books
    .filter((b) => b.availableCopies > 0 && (!q || b.title.toLowerCase().includes(q) || b.isbn.includes(q) || b.authors.some((a) => a.toLowerCase().includes(q))))
    .slice(0, 6);
  const selectedBook = books.find((b) => b.id === bookId);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!studentId || !bookId) return;
    issueBook.mutate(
      { studentId, bookId },
      {
        onSuccess: (res) => {
          toast.success(`"${res.bookTitle}" issued (copy ${res.barcode}). Due ${formatDate(res.dueDate)}.`);
          onClose();
        },
      },
    );
  };

  return (
    <Modal open onClose={onClose} title="Issue a book" description="Loans run for 14 days; overdue fines accrue daily." size="lg">
      <form onSubmit={submit} className="space-y-6">
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-slate-900 mb-2">1. Student</legend>
          <Field label="Search by roll number or name" hint="Type at least 3 characters.">
            <TextInput
              type="search"
              value={studentQuery}
              onChange={(e) => {
                setStudentQuery(e.target.value);
                setStudentId(null);
              }}
              autoComplete="off"
            />
          </Field>
          {selectedStudent ? (
            <SelectedChip label={`${selectedStudent.name} · ${selectedStudent.rollNumber}`} onClear={() => setStudentId(null)} />
          ) : (
            <OptionList
              loading={canSearch && students.isPending}
              empty={canSearch ? "No students match." : null}
              options={studentMatches.map((s) => ({ id: s.id, title: s.name, subtitle: `${s.rollNumber} · ${s.program}` }))}
              onSelect={setStudentId}
            />
          )}
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-slate-900 mb-2">2. Book</legend>
          <Field label="Search available books" hint="Only titles with a copy on the shelf are listed.">
            <TextInput
              type="search"
              value={bookQuery}
              onChange={(e) => {
                setBookQuery(e.target.value);
                setBookId(null);
              }}
              autoComplete="off"
            />
          </Field>
          {selectedBook ? (
            <SelectedChip label={`${selectedBook.title} · ${selectedBook.availableCopies} available`} onClear={() => setBookId(null)} />
          ) : (
            <OptionList
              loading={false}
              empty={q ? "No available books match." : books.length === 0 ? "The catalogue is empty." : null}
              options={bookMatches.map((b) => ({ id: b.id, title: b.title, subtitle: `${b.authors.join(", ")} · ${b.availableCopies} available` }))}
              onSelect={setBookId}
            />
          )}
        </fieldset>

        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!studentId || !bookId} loading={issueBook.isPending}>
            Issue book
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}

function OptionList({
  options,
  onSelect,
  loading,
  empty,
}: {
  options: { id: string; title: string; subtitle: string }[];
  onSelect: (id: string) => void;
  loading: boolean;
  empty: string | null;
}) {
  if (loading) return <p className="text-sm text-slate-500 px-1">Searching…</p>;
  if (options.length === 0) return empty ? <p className="text-sm text-slate-500 px-1">{empty}</p> : null;
  return (
    <ul className="rounded-xl border border-border-subtle divide-y divide-border-subtle overflow-hidden">
      {options.map((o) => (
        <li key={o.id}>
          <button type="button" onClick={() => onSelect(o.id)} className="w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-center gap-3">
            <Search aria-hidden className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-slate-900 truncate">{o.title}</span>
              <span className="block text-xs text-slate-500 truncate">{o.subtitle}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function SelectedChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <div className={"flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-container-low ring-1 ring-inset ring-primary-container/20"}>
      <span className="text-sm font-medium text-primary-container truncate">{label}</span>
      <button type="button" onClick={onClear} className="text-sm font-medium text-slate-600 hover:text-slate-900 shrink-0">
        Change
      </button>
    </div>
  );
}
