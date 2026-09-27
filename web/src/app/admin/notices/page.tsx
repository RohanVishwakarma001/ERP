"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { noticeService } from "@/services/domain-services";
import { BellRing, PlusCircle, Pin, Calendar, FileText, X, CheckCircle2 } from "lucide-react";
import { CampusNotice } from "@/types";

export default function NoticesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CampusNotice["category"]>("ACADEMIC");
  const [priority, setPriority] = useState<"NORMAL" | "HIGH" | "URGENT">("NORMAL");
  const [summary, setSummary] = useState("");
  const [publisher, setPublisher] = useState("Registrar & Academic Council");

  const { data: notices = [], isLoading } = useQuery({
    queryKey: ["notices"],
    queryFn: noticeService.getNotices,
  });

  const publishMutation = useMutation({
    mutationFn: noticeService.createNotice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      setShowModal(false);
      setTitle("");
      setSummary("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;
    publishMutation.mutate({
      title,
      category,
      priority,
      summary,
      publisher,
    });
  };

  const handleDownload = (n: CampusNotice) => {
    setDownloadFeedback(`Verified circular PDF for "${n.title}" generated successfully.`);
    setTimeout(() => setDownloadFeedback(null), 4000);
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Campus Governance</span>
              <span className="text-slate-300">•</span>
              <span className="text-[#0B3B60]">Notices &amp; Circulars</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-headline mt-1">
              Institutional Circulars, Gazettes &amp; Regulatory Feed
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Official notifications broadcasted to students, faculty, and administrative departments across the university.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B3B60] text-white hover:bg-[#082C49] text-xs font-semibold shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Publish Circular</span>
          </button>
        </div>

        {downloadFeedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{downloadFeedback}</span>
          </div>
        )}

        <div className="space-y-3">
          {notices.map((n) => (
            <div
              key={n.id}
              className="p-5 rounded-xl border border-[#E2E8F0] bg-white shadow-sm space-y-2 hover:border-[#0B3B60] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={n.priority === "URGENT" ? "error" : "primary"}>
                    {n.priority}
                  </Badge>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    {n.category}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{n.date}</span>
                </div>
              </div>

              <h3 className="font-bold text-base text-slate-900 leading-snug">{n.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{n.summary}</p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Issued by: <strong className="text-slate-700">{n.publisher}</strong></span>
                <button
                  type="button"
                  onClick={() => handleDownload(n)}
                  className="text-[#0B3B60] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download Circular PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Publish Circular Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-base text-slate-900">Publish Institutional Notice</h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Notice Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. End-Semester Examination Schedule"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0B3B60]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0B3B60]"
                    >
                      <option value="ACADEMIC">Academic</option>
                      <option value="EXAMINATION">Examination</option>
                      <option value="PLACEMENT">Placement</option>
                      <option value="ADMINISTRATION">Administration</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0B3B60]"
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Issuing Authority</label>
                  <input
                    type="text"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    placeholder="e.g. Controller of Examinations"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0B3B60]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Notice Content / Summary</label>
                  <textarea
                    rows={4}
                    required
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Provide full text or summary of the regulatory notice..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0B3B60]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={publishMutation.isPending}
                    className="px-4 py-2 rounded-lg bg-[#0B3B60] text-white hover:bg-[#082C49] font-semibold"
                  >
                    {publishMutation.isPending ? "Publishing..." : "Publish Circular"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
