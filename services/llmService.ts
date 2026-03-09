import { api } from "./api";
import type {
  LLMAnswerResponse,
  LLMRequest,
  LLMResponse,
} from "@/types/api";

export const generateLLMResponse = async (
  payload: LLMRequest,
): Promise<LLMResponse> => api.post<LLMResponse>("/api/llm/generate", payload);

export const getSimpleLLMAnswer = async (
  prompt: string,
): Promise<LLMAnswerResponse> =>
  api.post<LLMAnswerResponse>("/api/llm/answer", { prompt });