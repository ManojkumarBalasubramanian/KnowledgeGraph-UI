import { api } from "./api";
import type {
  GraphRAGRequest,
  GraphRAGResponse,
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

export const getGraphRAGAnswer = async (
  payload: GraphRAGRequest,
): Promise<GraphRAGResponse> =>
  api.post<GraphRAGResponse>("/api/llm/graphrag", payload);