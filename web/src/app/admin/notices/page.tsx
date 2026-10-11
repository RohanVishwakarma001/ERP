"use client";

import { useState, type FormEvent } from "react";
import { BellRing, Calendar, PlusCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal, ModalActions } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { Checkbox, Field, SelectInput, TextArea, TextInput } from "@/components/ui/form-field";
import { QueryState } from "@/components/ui/query-state";
import {
  NOTICE_CATEGORIES,
  NOTICE_CATEGORY_LABELS,
  useCreateNotice,
  useNotices,
  type CreateNoticeInput,
} from "@/features/notices";
import { formatDate } from "@/lib/format";
import { toast } from "@/lib/toast-store";

const EMPTY_FORM: CreateNoticeInput = { title: "", summary: "", category: "CIRCULAR", isUrgent: false, authorName: "" };

export default function NoticesPage() {
  const notices = useNotices();
  const createNotice = useCreateNotice();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<CreateNoticeInput>(EMPTY_FORM);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createNotice.mutate(
      { ...form, authorName: form.authorName?.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Notice published.");
          setIsOpen(false);
          setForm(EMPTY_FORM);
        },
      },
    );
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          breadcrumbs={["Campus Governance", "Notices"]}
          title="Notices & Circulars"
          description="Official notices published to students, faculty and staff."
          actions={
            <Button icon={<PlusCircle className="w-4 h-4" />} onClick={() => setIsOpen(true)}>
              Publish Notice
            </Button>
          }
        />

        <QueryState query={notices} empty={{ title: "No notices yet", description: "Published notices will appear here.", icon: <BellRing className="w-5 h-5" /> }}>
          {(list) => (
            <div className="space-y-3">
              {list.map((n) => (
                <article key={n.id} className="p-5 rounded-2xl border border-border-subtle bg-white shadow-xs space-y-2">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      {n.isUrgent && <Badge variant="error">Urgent</Badge>}
                      <span className="text-xs font-medium text-slate-600">{NOTICE_CATEGORY_LABELS[n.category]}</span>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(n.publishedAt)}
                    </span>
                  </div>
                  <h2 className="font-semibold text-base text-slate-900 leading-snug">{n.title}</h2>
                  <p className="text-sm text-slate-600 leading-relaxed">{n.summary}</p>
                  <p className="pt-2 border-t border-slate-100 text-xs text-slate-400">
                    Issued by <strong className="text-slate-700">{n.authorName}</strong>
                  </p>
                </article>
              ))}
            </div>
          )}
        </QueryState>
      </div>

      <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Publish Notice" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Title">
            <TextInput required maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Category">
              <SelectInput
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as CreateNoticeInput["category"] })}
              >
                {NOTICE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {NOTICE_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Issuing office" hint="Defaults to your name" optional>
              <TextInput
                placeholder="e.g. Controller of Examinations"
                value={form.authorName}
                onChange={(e) => setForm({ ...form, authorName: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Summary">
            <TextArea required rows={4} maxLength={1000} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
          </Field>
          <Checkbox
            label="Mark as urgent"
            description="Urgent notices are pinned to the top and highlighted."
            checked={form.isUrgent}
            onChange={(e) => setForm({ ...form, isUrgent: e.target.checked })}
          />
          <ModalActions>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createNotice.isPending}>
              Publish
            </Button>
          </ModalActions>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
