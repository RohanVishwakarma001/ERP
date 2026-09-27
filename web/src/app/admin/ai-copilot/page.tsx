"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { aiService } from "@/services/domain-services";
import { AIResponse } from "@/types";
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  User,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "USER" | "AI";
  text: string;
  timestamp: string;
  dataCard?: AIResponse["dataCard"];
}

export default function AiCopilotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      sender: "AI",
      text: "Welcome to JBIT Campus Copilot. I am connected directly to our PostgreSQL Academic Engine to provide live answers on attendance compliance, examination cycles, fee structures, timetable allocations, and hostel amenities. How can I help you today?",
      timestamp: "Live",
    },
  ]);

  const [inputQuery, setInputQuery] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const presets = [
    "Classes to hit 75% attendance?",
    "When is my Cloud Computing mid-term?",
    "What is my pending semester fee?",
    "Summarize CS-602 Unit 3 notes",
    "How do I apply for Hostel Outpass?",
  ];

  const handleSend = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "USER",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsThinking(true);

    try {
      const response = await aiService.askQuery(q);
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "AI",
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        dataCard: response.dataCard,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        {/* Header Strip matching Stitch AI Hub */}
        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B3B60] text-white flex items-center justify-center shadow-md">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 font-headline">JBIT AI Campus Copilot</h1>
                <Badge variant="success" pulse>Synced with ERP Engine</Badge>
              </div>
              <p className="text-xs text-slate-500">Autonomous context engine trained on UTU Ordinance, Syllabi &amp; Institutional Ledgers.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Preset Prompt Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(preset)}
              className="shrink-0 px-3 py-1.5 rounded-full border border-[#E2E8F0] bg-white text-xs font-medium text-slate-700 hover:bg-[#F8FAFC] hover:border-[#0B3B60] transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0B3B60]" />
              <span>{preset}</span>
            </button>
          ))}
        </div>

        {/* Chat Stream Window */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 min-h-[460px] flex flex-col justify-between">
          <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === "USER" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "AI" && (
                  <div className="w-8 h-8 rounded-full bg-[#0B3B60] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs ${
                    msg.sender === "USER"
                      ? "bg-[#0B3B60] text-white rounded-br-xs"
                      : "bg-[#F8FAFC] border border-[#E2E8F0] text-slate-800 rounded-tl-xs space-y-3"
                  }`}
                >
                  <p className="leading-relaxed text-sm">{msg.text}</p>

                  {/* Render Data Card if available */}
                  {msg.dataCard && (
                    <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">{msg.dataCard.title}</span>
                        {msg.dataCard.badgeText && (
                          <Badge variant="warning">{msg.dataCard.badgeText}</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                        {msg.dataCard.metrics.map((m, mIdx) => (
                          <div key={mIdx}>
                            <span className="text-[10px] text-slate-400 block">{m.label}</span>
                            <span className={`font-bold text-sm ${m.color || "text-slate-800"}`}>
                              {m.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <span className={`block text-[10px] ${msg.sender === "USER" ? "text-slate-300 text-right" : "text-slate-400"}`}>
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === "USER" && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    U
                  </div>
                )}
              </div>
            ))}

            {isThinking && (
              <div className="flex gap-3 justify-start items-center">
                <div className="w-8 h-8 rounded-full bg-[#0B3B60] text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-slate-500 animate-pulse">
                  Querying JBIT ERP Knowledge Base &amp; UTU Nodes...
                </div>
              </div>
            )}
          </div>

          {/* Prompt Input Box */}
          <div className="pt-4 border-t border-[#E2E8F0] mt-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask JBIT AI about attendance, exam schedule, fees, timetable..."
                className="flex-1 h-11 px-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0B3B60] focus:ring-2 focus:ring-[#0B3B60]/10 transition-all"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isThinking}
                className="h-11 px-5 rounded-xl bg-[#0B3B60] hover:bg-[#082C49] text-white font-semibold text-xs flex items-center gap-2 disabled:opacity-40 transition-all cursor-pointer shadow-xs"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
