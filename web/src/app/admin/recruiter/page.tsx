"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { placementService } from "@/services/domain-services";
import { CandidateApplication } from "@/types";
import {
  Award,
  CheckCircle2,
  FileCheck,
  Star,
  UserCheck,
  Send,
  Sparkles,
} from "lucide-react";

export default function RecruiterConsolePage() {
  const queryClient = useQueryClient();
  const [selectedApp, setSelectedApp] = useState<CandidateApplication | null>(null);
  const [techScore, setTechScore] = useState<number>(9.0);
  const [codeScore, setCodeScore] = useState<number>(9.5);
  const [comments, setComments] = useState<string>("Solid algorithmic background, demonstrated live coding mastery.");
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const { data: applications = [] } = useQuery({
    queryKey: ["placementApplications"],
    queryFn: placementService.getApplications,
  });

  const signLoiMutation = useMutation({
    mutationFn: placementService.signLoi,
    onSuccess: (res) => {
      setFeedbackSuccess(`LOI Issued & Verified with DigiLocker. Hash: ${res.receiptHash}`);
      queryClient.invalidateQueries({ queryKey: ["placementApplications"] });
      setTimeout(() => setFeedbackSuccess(null), 5000);
    },
  });

  return (
    <DashboardLayout role="ADMIN">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Placement &amp; Corporate Relations</span>
              <span className="text-slate-300">/</span>
              <span className="text-[#0B3B60]">Recruiter Scoring Console</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-headline mt-1">
              Corporate Recruiter Candidate Evaluation &amp; LOI Console
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live scoring rubric, technical interview grading, panel feedback sync, and automated DigiLocker LOI issuance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="primary" pulse>
              Panel Calibration Active
            </Badge>
          </div>
        </div>

        {feedbackSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{feedbackSuccess}</span>
          </div>
        )}

        {/* Candidate Evaluation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Applications Queue */}
          <div className="lg:col-span-7 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Interview Evaluation Queue ({applications.length})
            </h2>

            {applications.map((app) => (
              <div
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className={`p-4 rounded-xl border bg-white shadow-2xs transition-all cursor-pointer ${
                  selectedApp?.id === app.id
                    ? "border-[#0B3B60] ring-2 ring-[#0B3B60]/10"
                    : "border-[#E2E8F0] hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0B3B60] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {app.studentName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{app.studentName}</h3>
                      <p className="text-xs text-slate-500 font-mono">Roll: #{app.rollNumber} • {app.branch}</p>
                    </div>
                  </div>

                  <Badge variant={app.status === "OFFERED" ? "success" : "info"}>
                    {app.status}
                  </Badge>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">
                    Drive: <strong className="text-[#0B3B60]">{app.companyName}</strong> ({app.roleTitle})
                  </span>
                  <span className="font-bold text-slate-900 font-tabular-nums">
                    CGPA: {app.cgpa}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Scoring Console Panel */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 sticky top-20">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-[#E2E8F0]">
                Candidate Rubric Scoring Panel
              </h3>

              {selectedApp ? (
                <div className="space-y-4">
                  <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                    <p className="font-bold text-sm text-slate-900">{selectedApp.studentName}</p>
                    <p className="text-xs text-slate-500">{selectedApp.companyName} — {selectedApp.roleTitle}</p>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Technical Core / Systems Knowledge</span>
                      <span className="font-bold text-[#0B3B60]">{techScore} / 10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={techScore}
                      onChange={(e) => setTechScore(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0B3B60]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Live Coding &amp; Problem Solving</span>
                      <span className="font-bold text-[#0B3B60]">{codeScore} / 10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={codeScore}
                      onChange={(e) => setCodeScore(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0B3B60]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Panel Evaluation Notes
                    </label>
                    <textarea
                      rows={3}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[#E2E8F0] text-xs text-slate-800 bg-[#F8FAFC] focus:outline-none focus:border-[#0B3B60]"
                    />
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      disabled={signLoiMutation.isPending}
                      onClick={() => signLoiMutation.mutate(selectedApp.id)}
                      className="w-full py-2.5 rounded-lg bg-[#0B3B60] hover:bg-[#082C49] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Award className="w-4 h-4" />
                      <span>{signLoiMutation.isPending ? "Issuing LOI..." : "Recommend & Issue Digital LOI"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Select a candidate from the evaluation queue to begin scoring.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
