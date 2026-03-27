"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { APIRequestError } from "@/services/api";
import { generateLLMResponse, getGraphRAGAnswer, getSimpleLLMAnswer } from "@/services/llmService";
import { getHealth, getReadyHealth } from "@/services/systemService";
import { orchestrateLLMChat, getLLMSessionHistory } from "@/services/llmSessionService";
import type {
  GraphRAGMetadata,
  GraphRAGResponse,
  LLMAnswerResponse,
  LLMResponse,
} from "@/types/api";

type ChatMode = "detailed" | "simple" | "data";
type DataChatReadiness = "checking" | "ready" | "backend-unavailable" | "dependencies-not-ready";

interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	text: string;
	mode: ChatMode;
	meta?: string;
	graphrag?: GraphRAGMetadata;
}

interface Conversation {
	id: string;
	session_id: string;
	title: string;
	createdAt: number;
	messages: ChatMessage[];
}

const starterPrompt = "Explain how a knowledge graph supports metadata governance.";

const SESSION_STORAGE_KEY = "llm_chat_session_id";

const makeId = () =>
	`${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createNewConversation = (sessionId?: string): Conversation => ({
	id: makeId(),
	session_id: sessionId ?? crypto.randomUUID?.() ?? makeId(),
	title: "New chat",
	createdAt: Date.now(),
	messages: [],
});

const mapOrchestrationHistory = (history: Array<any>, mode: ChatMode): ChatMessage[] =>
	history
		.map((entry, idx) => {
			if (Array.isArray(entry)) {
				const [role, message] = entry;
				return {
					id: `${idx}-${Date.now()}`,
					role: role === "llm" ? "assistant" : role,
					text: message,
					mode,
				};
			}

			if (entry && typeof entry === "object") {
				const role = (entry as any).role;
				const message = (entry as any).message;
				return {
					id: `${idx}-${Date.now()}`,
					role: role === "llm" ? "assistant" : role,
					text: message ?? "",
					mode,
				};
			}

			return null;
		})
		.filter((item): item is ChatMessage => item !== null);


const normalizeError = (err: unknown): string => {
	if (err instanceof APIRequestError) {
		return typeof err.detail === "string"
			? err.detail
			: JSON.stringify(err.detail, null, 2);
	}

	return "LLM call failed.";
};

export default function LLMPlaygroundPage() {
	const [mode, setMode] = useState<ChatMode>("data");
	const [prompt, setPrompt] = useState(starterPrompt);
	const [maxTokens, setMaxTokens] = useState(4000);
	const topK = 10;
	const [conversations, setConversations] = useState<Conversation[]>([
		createNewConversation(),
	]);
	const [activeConversationId, setActiveConversationId] = useState<string>(() =>
		conversations[0]?.id ?? "",
	);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [dataChatReadiness, setDataChatReadiness] = useState<DataChatReadiness>("checking");
	const [debugRawResponse, setDebugRawResponse] = useState<any>(null);
	const scrollAnchorRef = useRef<HTMLDivElement | null>(null);

	const activeConversation = useMemo(
		() => conversations.find((item) => item.id === activeConversationId) ?? null,
		[conversations, activeConversationId],
	);

	useEffect(() => {
		scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
	}, [activeConversation?.messages, isLoading]);

	useEffect(() => {
		const initializeSession = async () => {
			let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
			if (!sessionId) {
				sessionId = crypto.randomUUID?.() ?? makeId();
				localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
			}

			const conversation = createNewConversation(sessionId);
			setConversations([conversation]);
			setActiveConversationId(conversation.id);

			try {
				const data = await getLLMSessionHistory(sessionId);
				if (Array.isArray(data.history) && data.history.length > 0) {
					const mappedMessages = data.history.map((entry, idx) => {
						if (Array.isArray(entry)) {
							const [role, message] = entry;
							return {
								id: `${conversation.id}-${idx}`,
								role: role === "llm" ? "assistant" : role,
								text: message,
								mode,
							};
						}

						if (entry && typeof entry === "object") {
							return {
								id: `${conversation.id}-${idx}`,
								role: entry.role === "llm" ? "assistant" : entry.role,
								text: (entry as any).message ?? "",
								mode,
							};
						}

						return null;
					}).filter((m): m is ChatMessage => m !== null);

					setConversationMessages(conversation.id, mappedMessages);
					setDebugRawResponse(data);
				}
			} catch {
				// keep default conversation if history fails
			}
		};

		void initializeSession();
	}, []);

	useEffect(() => {
		if (!activeConversationId && conversations.length > 0) {
			setActiveConversationId(conversations[0].id);
		}
	}, [conversations, activeConversationId]);
	useEffect(() => {
		if (mode !== "data") {
			return;
		}

		void checkGraphRAGReadiness();
	}, [mode]);

	const checkGraphRAGReadiness = async (): Promise<boolean> => {
		setDataChatReadiness("checking");
		try {
			const health = await getHealth();
			const ready = await getReadyHealth();

			const backendUp = ["UP", "alive"].includes(health.status);
			if (!backendUp) {
				setDataChatReadiness("backend-unavailable");
				return false;
			}

			const dependenciesReady = ["ready", "UP"].includes(ready.status);
			if (!dependenciesReady) {
				setDataChatReadiness("dependencies-not-ready");
				return false;
			}

			setDataChatReadiness("ready");
			return true;
		} catch {
			setDataChatReadiness("backend-unavailable");
			return false;
		}
	};

	const setConversationMessages = (conversationId: string, messages: ChatMessage[]) => {
		setConversations((prev) =>
			prev.map((conversation) => {
				if (conversation.id !== conversationId) {
					return conversation;
				}

				const firstUserMessage = messages.find((item) => item.role === "user")?.text;
				const title = firstUserMessage
					? firstUserMessage.slice(0, 48)
					: conversation.title;

				return {
					...conversation,
					title,
					messages,
				};
			}),
		);
	};

	const createConversation = () => {
		const conversation = createNewConversation();
		localStorage.setItem(SESSION_STORAGE_KEY, conversation.session_id);
		setConversations((prev) => [conversation, ...prev]);
		setActiveConversationId(conversation.id);
		setPrompt("");
		setError("");
	};

	const sendPrompt = async () => {
		const trimmedPrompt = prompt.trim();
		if (!trimmedPrompt || !activeConversation) {
			return;
		}

		setIsLoading(true);
		setError("");

		const userMessage: ChatMessage = {
			id: makeId(),
			role: "user",
			text: trimmedPrompt,
			mode,
		};

		const baseMessages = [...activeConversation.messages, userMessage];
		setConversationMessages(activeConversation.id, baseMessages);
		setPrompt("");

		try {
			if (mode === "data") {
				const isReady = await checkGraphRAGReadiness();
				if (!isReady) {
					setError(
						dataChatReadiness === "dependencies-not-ready"
							? "Neo4j/backend dependency is not ready."
							: "Backend unavailable.",
					);
					setIsLoading(false);
					return;
				}
			}

			const session_id = activeConversation.session_id;
			let orchestration: any = null;
			let orchestrationError: unknown = null;

			try {
				orchestration = await orchestrateLLMChat({
					session_id,
					user_message: trimmedPrompt,
					mode,
				});
				setDebugRawResponse(orchestration);
			} catch (err) {
				orchestrationError = err;
			}

			const applyLegacyLLM = async () => {
				if (mode === "detailed") {
					const result: LLMResponse = await generateLLMResponse({
						prompt: trimmedPrompt,
						max_tokens: maxTokens,
					});
					const assistantMessage: ChatMessage = {
						id: makeId(),
						role: "assistant",
						text: result.response || "No response text was returned.",
						mode,
						meta: result.tokens
							? `model: ${result.model ?? "unknown"} | tokens: ${result.tokens.total_tokens}`
							: `model: ${result.model ?? "unknown"}`,
					};
					setConversationMessages(activeConversation.id, [...baseMessages, assistantMessage]);
					return;
				}

				if (mode === "data") {
					const result: GraphRAGResponse = await getGraphRAGAnswer({
						question: trimmedPrompt,
						top_k: topK,
					});
					const rag = result.graphrag;
					const assistantMessage: ChatMessage = {
						id: makeId(),
						role: "assistant",
						text: result.response || "No answer text was returned.",
						mode,
						graphrag: rag,
						meta: `model: ${result.model ?? "unknown"} | top_k: ${rag?.top_k_requested ?? topK}`,
					};
					setConversationMessages(activeConversation.id, [...baseMessages, assistantMessage]);
					return;
				}

				const result: LLMAnswerResponse = await getSimpleLLMAnswer(trimmedPrompt);
				const assistantMessage: ChatMessage = {
					id: makeId(),
					role: "assistant",
					text: result.answer || "No answer text was returned.",
					mode,
					meta: "endpoint: /api/llm/answer",
				};
				setConversationMessages(activeConversation.id, [...baseMessages, assistantMessage]);
			};

			if (orchestration && Array.isArray(orchestration.history) && orchestration.history.length > 0) {
				const mapped = mapOrchestrationHistory(orchestration.history, mode);
				setConversationMessages(activeConversation.id, mapped);
				return;
			}

			if (orchestration && (orchestration.latest_response || orchestration.response)) {
				const assistantMessage: ChatMessage = {
					id: makeId(),
					role: "assistant",
					text: orchestration.latest_response ?? orchestration.response ?? "No response text was returned.",
					mode,
					meta: orchestration.model
						? `model: ${orchestration.model} | finish_reason: ${orchestration.finish_reason ?? "unknown"}`
						: undefined,
				};
				setConversationMessages(activeConversation.id, [...baseMessages, assistantMessage]);
				return;
			}

			if (orchestrationError) {
				// Fallback to legacy behavior if orchestrate API not available or failed.
				await applyLegacyLLM();
				return;
			}

			await applyLegacyLLM();
		} catch (err) {
			setError(normalizeError(err));
		} finally {
			setIsLoading(false);
		}
	};

	const handleComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			void sendPrompt();
		}
	};

	return (
		<div className="grid min-h-[calc(100vh-9rem)] gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
			<aside className="surface hidden h-full p-4 lg:flex lg:flex-col">
				<button
					type="button"
					onClick={createConversation}
					className="btn-primary w-full"
				>
					+ New chat
				</button>

				<div className="mt-5 rounded-xl border border-blue-200 bg-blue-50/70 p-3">
					<label className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700/80">
						Mode
					</label>
					<select
						value={mode}
						onChange={(e) => setMode(e.target.value as ChatMode)}
						className="select-field mt-2"
					>
						<option value="simple">Quick Answer</option>
						<option value="detailed">Detailed Generate</option>
						<option value="data">Data Chat (GraphRAG)</option>
					</select>
				</div>

				<div className="mt-4 min-h-0 flex-1 space-y-2 overflow-auto pr-1">
					{conversations.map((conversation) => {
						const isActive = conversation.id === activeConversationId;
						return (
							<button
								key={conversation.id}
								type="button"
								onClick={() => {
									localStorage.setItem(SESSION_STORAGE_KEY, conversation.session_id);
									setActiveConversationId(conversation.id);
								}}
								className={`w-full rounded-xl border px-3 py-2 text-left transition ${
									isActive
										? "border-blue-500 bg-blue-100 text-blue-950"
										: "border-blue-200 bg-white text-blue-800 hover:border-blue-400"
								}`}
							>
								<p className="truncate text-sm font-semibold">{conversation.title}</p>
								<p className="mt-0.5 text-xs text-blue-700/70">
									{new Date(conversation.createdAt).toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</p>
							</button>
						);
					})}
				</div>
			</aside>

			<section className="surface flex h-full min-h-[calc(100vh-9rem)] flex-col overflow-hidden">
				<header className="border-b border-blue-100 px-5 py-4">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h2 className="font-display text-2xl font-semibold text-blue-950">LLM Playground</h2>
							<p className="text-sm text-blue-700/80">
								Chat-style interface for /api/llm/answer and /api/llm/generate.
							</p>
						</div>
						<div className="flex flex-col items-start gap-2 sm:items-end">
							<div className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-900">
								<span className="font-semibold">Active mode:</span>
								<span>
									{mode === "simple"
										? "Quick Answer"
										: mode === "detailed"
											? "Detailed Generate"
											: "Data Chat (GraphRAG)"}
								</span>
							</div>
						</div>
					</div>
					{mode === "detailed" ? (
						<div className="mt-3 max-w-xs">
							<label className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700/80">
								Max Tokens
							</label>
							<input
								type="number"
								min={1}
								value={maxTokens}
								onChange={(event) => setMaxTokens(Number(event.target.value) || 4000)}
								className="input-field mt-1"
							/>
						</div>
					) : null}
					{mode === "data" && dataChatReadiness !== "ready" ? (
						<div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">
							{dataChatReadiness === "checking" ? "Checking backend readiness..." : null}
							{dataChatReadiness === "backend-unavailable" ? "Backend unavailable." : null}
							{dataChatReadiness === "dependencies-not-ready"
								? "Neo4j/backend dependency not ready."
								: null}
						</div>
					) : null}
				</header>

				<div className="min-h-0 flex-1 overflow-auto px-5 py-5">						{debugRawResponse ? (
							<pre className="mb-3 rounded bg-gray-100 p-2 text-xs text-gray-700 overflow-auto max-h-40 border border-gray-200">
								<strong>Debug: Raw backend response</strong>\n{JSON.stringify(debugRawResponse, null, 2)}
							</pre>
						) : null}					{activeConversation && activeConversation.messages.length > 0 ? (
						<div className="mx-auto flex max-w-4xl flex-col gap-4">
							{activeConversation.messages.map((message) => {
								const isUser = message.role === "user";
								return (
									<div
										key={message.id}
										className={`flex ${isUser ? "justify-end" : "justify-start"}`}
									>
										<div
											className={`max-w-[85%] rounded-2xl px-4 py-3 ${
												isUser
													? "bg-gradient-to-r from-[#005cb9] via-[#1b73cf] to-[#2a86e0] text-white"
													: "border border-blue-200 bg-white text-blue-950"
											}`}
										>
											<p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p>
											{message.mode === "data" && message.graphrag ? (
												<div className="mt-2 space-y-2">
													<div className="flex flex-wrap gap-2 text-[11px]">
														<span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-blue-900">
															Context: {message.graphrag.context_nodes_found}
														</span>
														{!message.graphrag.embedding_used || message.graphrag.context_nodes_found === 0 ? (
															<span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-amber-700">
																Degraded mode
															</span>
														) : null}
													</div>
													<details className="rounded-lg border border-blue-100 bg-blue-50/60 p-2">
														<summary className="cursor-pointer text-xs font-semibold text-blue-900">
															Developer trace
														</summary>
														<div className="mt-1 text-xs text-blue-800">
															<p>trace_id: {message.graphrag.trace_id}</p>
															<p>embedding_used: {String(message.graphrag.embedding_used)}</p>
															<p>top_k_requested: {message.graphrag.top_k_requested}</p>
															<p>elapsed_ms: {message.graphrag.elapsed_ms}</p>
														</div>
													</details>
												</div>
											) : null}
											{message.meta ? (
												<p className={`mt-2 text-xs ${isUser ? "text-blue-100/90" : "text-blue-700/80"}`}>
													{message.meta}
												</p>
											) : null}
										</div>
									</div>
								);
							})}
							{isLoading ? (
								<div className="flex justify-start">
									<div className="rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm text-blue-700">
										Thinking...
									</div>
								</div>
							) : null}
							<div ref={scrollAnchorRef} />
						</div>
					) : (
						<div className="mx-auto flex h-full max-w-3xl items-center justify-center">
							<div className="text-center">
								<h3 className="font-display text-3xl font-semibold text-blue-950">Start a conversation</h3>
								<p className="mt-2 text-blue-700/80">
									Ask about metadata governance, lineage, or schema mapping.
								</p>
							</div>
						</div>
					)}
				</div>

				<footer className="border-t border-blue-100 px-5 py-4">
					<div className="mx-auto max-w-4xl">
						{error ? (
							<pre className="alert-error mb-3 max-h-32 overflow-auto text-xs">
								{error}
							</pre>
						) : null}
						<div className="rounded-2xl border border-blue-200 bg-white p-2 shadow-[0_8px_24px_rgba(0,58,140,0.08)]">
							<textarea
								value={prompt}
								onChange={(event) => setPrompt(event.target.value)}
								onKeyDown={handleComposerKeyDown}
								placeholder="Message LLM Playground..."
								rows={3}
								className="textarea-field min-h-20 resize-none border-0 p-2 shadow-none focus:ring-0"
							/>
							<div className="flex items-center justify-between px-2 pb-1">
								<p className="text-xs text-blue-700/80">Press Enter to send, Shift+Enter for new line</p>
								<button
									type="button"
									onClick={() => void sendPrompt()}
									disabled={
										isLoading ||
										!prompt.trim() ||
										(mode === "data" && dataChatReadiness !== "ready")
									}
									className="btn-primary"
								>
									Send
								</button>
							</div>
						</div>
					</div>
				</footer>
			</section>
		</div>
	);
}
