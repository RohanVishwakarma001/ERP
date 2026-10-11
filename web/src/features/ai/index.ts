import { useMutation } from "@tanstack/react-query";
import { httpClient } from "@/lib/api/http-client";

export type CopilotIntent = "ATTENDANCE" | "FEES" | "SCHEDULE" | "EXAM" | "TRANSPORT" | "GENERAL";

/** POST /ai/chat */
export interface CopilotReply {
  intent: CopilotIntent;
  answer: string;
  data?: Record<string, unknown>;
}

export const aiApi = {
  ask: async (query: string): Promise<CopilotReply> => (await httpClient.post("/ai/chat", { query })).data,
};

/** Errors are rendered inline in the conversation, so the global error toast is suppressed. */
export function useAskCopilot() {
  return useMutation({ mutationFn: aiApi.ask, meta: { silentError: true } });
}
