"use client";

import { useState } from "react";
import { APIRequestError } from "@/services/api";
import { generateLLMResponse, getSimpleLLMAnswer } from "@/services/llmService";
import type { LLMAnswerResponse, LLMResponse } from "@/types/api";

export default function DomainsPage() {
	const [prompt, setPrompt] = useState("Explain how a knowledge graph supports metadata governance.");
	const [maxTokens, setMaxTokens] = useState(4000);
	const [fullResult, setFullResult] = useState<LLMResponse | null>(null);
	const [simpleResult, setSimpleResult] = useState<LLMAnswerResponse | null>(null);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const runFull = async () => {
		setIsLoading(true);
		setError("");
		try {
			const result = await generateLLMResponse({ prompt: prompt.trim(), max_tokens: maxTokens });
			setFullResult(result);
		} catch (err) {
			if (err instanceof APIRequestError) {
				setError(
					typeof err.detail === "string"
						? err.detail
						: JSON.stringify(err.detail, null, 2),
				);
			} else {
				setError("LLM generate call failed.");
			}
		} finally {
			setIsLoading(false);
		}
	};

	const runSimple = async () => {
		setIsLoading(true);
		setError("");
		try {
			const result = await getSimpleLLMAnswer(prompt.trim());
			setSimpleResult(result);
		} catch (err) {
			if (err instanceof APIRequestError) {
				setError(
					typeof err.detail === "string"
						? err.detail
						: JSON.stringify(err.detail, null, 2),
				);
			} else {
				setError("LLM answer call failed.");
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-5">
			<section className="surface p-6">
				<h2 className="font-display text-3xl text-blue-950">LLM Studio</h2>
				<p className="mt-1 text-sm text-blue-900/75">
					Test both API modes: detailed metadata response and lightweight text answer.
				</p>

				<textarea
					className="textarea-field mt-4 min-h-32"
					onChange={(event) => setPrompt(event.target.value)}
					value={prompt}
				/>

				<div className="mt-3 flex flex-wrap items-center gap-3">
					<input
						className="input-field w-28"
						min={1}
						onChange={(event) => setMaxTokens(Number(event.target.value) || 4000)}
						type="number"
						value={maxTokens}
					/>
					<button
						className="btn-primary"
						disabled={isLoading || !prompt.trim()}
						onClick={runFull}
						type="button"
					>
						Generate Detailed Response
					</button>
					<button
						className="btn-secondary"
						disabled={isLoading || !prompt.trim()}
						onClick={runSimple}
						type="button"
					>
						Get Simple Answer
					</button>
				</div>

				{error ? (
					<pre className="alert-error mt-4 overflow-auto text-xs">
						{error}
					</pre>
				) : null}
			</section>

			<section className="grid gap-4 xl:grid-cols-2">
				<article className="surface p-4">
					<h3 className="text-lg font-semibold text-blue-950">/api/llm/generate</h3>
					<pre className="mono code-panel mt-3 max-h-96 overflow-auto text-xs">
						{fullResult ? JSON.stringify(fullResult, null, 2) : "No generate response yet."}
					</pre>
				</article>

				<article className="surface p-4">
					<h3 className="text-lg font-semibold text-blue-950">/api/llm/answer</h3>
					<pre className="mono code-panel mt-3 max-h-96 overflow-auto text-xs">
						{simpleResult ? JSON.stringify(simpleResult, null, 2) : "No simple answer yet."}
					</pre>
				</article>
			</section>
		</div>
	);
}
