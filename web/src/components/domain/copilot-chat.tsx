"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { clsx } from "clsx";
import { Bot, Send, Sparkles } from "lucide-react";
import { useAskCopilot } from "@/features/ai";
import { getErrorMessage } from "@/lib/api/api-error";

interface Message {
  id: number;
  from: "user" | "ai";
  text: string;
  isError?: boolean;
}

const PRESETS = [
  "What is my attendance?",
  "Do I have pending fees?",
  "What classes do I have left today?",
  "When is my next exam?",
  "Which bus do I take?",
];

const WELCOME: Message = {
  id: 0,
  from: "ai",
  text: "Hi! I answer from your live records — attendance, fees, today's classes, upcoming exams and your bus pass.",
};

/** Chat UI over POST /ai/chat. Failed requests are shown inline instead of being lost. */
export function CopilotChat() {
  const ask = useAskCopilot();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const nextId = useRef(1);
  const threadRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view.
  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, ask.isPending]);

  const send = (text: string) => {
    const query = text.trim();
    if (!query || ask.isPending) return;
    const id = nextId.current;
    nextId.current += 2;
    setMessages((prev) => [...prev, { id, from: "user", text: query }]);
    setInput("");
    ask.mutate(query, {
      onSuccess: (reply) => setMessages((prev) => [...prev, { id: id + 1, from: "ai", text: reply.answer }]),
      onError: (err) => setMessages((prev) => [...prev, { id: id + 1, from: "ai", text: getErrorMessage(err), isError: true }]),
    });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => send(preset)}
            disabled={ask.isPending}
            className="shrink-0 h-9 px-3 rounded-full border border-border-strong bg-white text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary-container" />
            {preset}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border-subtle shadow-xs p-4 sm:p-6 min-h-[420px] flex flex-col justify-between">
        <div ref={threadRef} role="log" aria-label="Conversation" className="space-y-4 overflow-y-auto max-h-[min(500px,60dvh)] pr-1" aria-live="polite">
          {messages.map((m) => (
            <div key={m.id} className={clsx("flex gap-3", m.from === "user" ? "justify-end" : "justify-start")}>
              {m.from === "ai" && (
                <div aria-hidden className="w-8 h-8 rounded-full bg-surface-container text-primary-container flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <p
                className={clsx(
                  "max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed",
                  m.from === "user" && "bg-primary-container text-white rounded-br-xs",
                  m.from === "ai" && !m.isError && "bg-slate-100 text-slate-800 rounded-tl-xs",
                  m.isError && "bg-red-50 text-red-900 rounded-tl-xs",
                )}
              >
                {m.text}
              </p>
            </div>
          ))}
          {ask.isPending && <p className="text-xs text-slate-500 animate-pulse pl-11">Looking up your records…</p>}
        </div>

        <form onSubmit={onSubmit} className="flex items-center gap-2 pt-4 border-t border-border-subtle mt-4">
          <label htmlFor="copilot-input" className="sr-only">
            Your question
          </label>
          <input
            id="copilot-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={500}
            placeholder="Ask about attendance, fees, classes, exams or transport…"
            className="flex-1 min-w-0 h-11 px-4 rounded-xl border border-border-strong bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary-container focus:ring-4 focus:ring-primary-container/10"
          />
          <button
            type="submit"
            disabled={!input.trim() || ask.isPending}
            aria-label="Send"
            className="h-11 px-4 sm:px-5 rounded-xl bg-primary-container hover:bg-primary text-white font-semibold text-sm flex items-center gap-2 disabled:opacity-40"
          >
            <span className="hidden sm:inline">Send</span> <Send aria-hidden className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
