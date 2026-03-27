import { api } from "./api";

export type LLMChatHistoryTuple = ["user" | "llm" | "assistant", string];

export interface LLMChatHistoryObject {
  role: "user" | "llm" | "assistant";
  message: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface LLMChatOrchestrateRequest {
  session_id: string;
  user_message: string;
  mode?: string;
}

export interface LLMChatOrchestrateResponse {
  session_id: string;
  history: Array<LLMChatHistoryTuple | LLMChatHistoryObject>;
  input?: string;
  latest_response?: string;
  response?: string;
  stream?: boolean;
  model?: string;
  finish_reason?: string;
  tokens?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  [key: string]: unknown;
}

export const orchestrateLLMChat = async (
  payload: LLMChatOrchestrateRequest,
): Promise<LLMChatOrchestrateResponse> =>
  api.post<LLMChatOrchestrateResponse>("/llm/chat_orchestrate", payload);

export const getLLMSessionHistory = async (
  session_id: string,
): Promise<LLMChatOrchestrateResponse> =>
  api.get<LLMChatOrchestrateResponse>(`/llm/session/${session_id}`);
