import {
	generateImage,
	type UIMessage,
	createUIMessageStream,
	createUIMessageStreamResponse,
} from "ai";

import { createLLMGateway } from "@llmgateway/ai-sdk-provider";

export const maxDuration = 300; // 5 minutes

interface ChatRequestBody {
	messages: UIMessage[];
	model?: string;
	apiKey?: string;
	provider?: string;
	mode?: "image" | "chat";
	image_config?: {
		aspect_ratio?:
			| "auto"
			| "1:1"
			| "9:16"
			| "16:9"
			| "3:4"
			| "4:3"
			| "3:2"
			| "2:3"
			| "5:4"
			| "4:5"
			| "21:9"
			| "1:4"
			| "4:1"
			| "1:8"
			| "8:1";
		image_size?: "0.5K" | "1K" | "2K" | "4K" | string;
		n?: number;
	};
	reasoning_effort?: "minimal" | "low" | "medium" | "high";
	web_search?: boolean;
	mcp_servers?: unknown[];
	is_image_gen?: boolean;
}

interface OpenAICompatibleMessage {
	role: "system" | "user" | "assistant";
	content:
		| string
		| Array<
				| {
						type: "text";
						text: string;
				  }
				| {
						type: "image_url";
						image_url: {
							url: string;
						};
				  }
		  >;
}

const ROUTE_DEBUG_PREFIX = "[KiwiLLM Playground API]";

function jsonErrorResponse(
	error: string,
	status: number,
	additionalBody?: Record<string, unknown>,
) {
	return Response.json(
		{
			error,
			...(additionalBody ?? {}),
		},
		{ status },
	);
}

function normalizeMessageText(content: unknown): string {
	if (typeof content === "string") {
		return content;
	}

	if (!Array.isArray(content)) {
		return "";
	}

	return content
		.map((part) => {
			if (
				typeof part === "object" &&
				part !== null &&
				"text" in part &&
				typeof (part as { text?: unknown }).text === "string"
			) {
				return (part as { text: string }).text;
			}

			return "";
		})
		.join("");
}

function toOpenAICompatibleMessages(
	messages: UIMessage[],
): OpenAICompatibleMessage[] {
	const result: OpenAICompatibleMessage[] = [];

	for (const message of messages) {
		const textParts = message.parts
			.filter(
				(part): part is { type: "text"; text: string } => part.type === "text",
			)
			.map((part) => part.text)
			.filter(Boolean);

		const imageParts = message.parts
			.filter(
				(
					part,
				): part is {
					type: "file";
					url: string;
					mediaType: string;
				} =>
					part.type === "file" &&
					"url" in part &&
					typeof part.url === "string" &&
					"mediaType" in part &&
					typeof part.mediaType === "string" &&
					part.mediaType.startsWith("image/"),
			)
			.map((part) => ({
				type: "image_url" as const,
				image_url: {
					url: part.url,
				},
			}));

		const role =
			message.role === "assistant" || message.role === "system"
				? message.role
				: "user";

		if (imageParts.length === 0) {
			const content = textParts.join("\n").trim();
			if (content) {
				result.push({
					role,
					content,
				});
			}
			continue;
		}

		const contentParts = [
			...textParts.map((text) => ({
				type: "text" as const,
				text,
			})),
			...imageParts,
		];

		if (contentParts.length > 0) {
			result.push({
				role,
				content: contentParts,
			});
		}
	}

	return result;
}

function extractResponsesApiText(output: unknown): string {
	if (!Array.isArray(output)) {
		return "";
	}

	return output
		.filter(
			(item): item is { type?: unknown; content?: unknown } =>
				typeof item === "object" && item !== null,
		)
		.filter((item) => item.type === "message")
		.map((item) => normalizeMessageText(item.content))
		.join("");
}

function extractAssistantTextFromResponse(data: Record<string, unknown>): string {
	const responsesApiText = extractResponsesApiText(data.output);
	if (responsesApiText) {
		return responsesApiText;
	}

	const choices = data.choices;
	if (!Array.isArray(choices) || choices.length === 0) {
		return "";
	}

	const firstChoice = choices[0];
	if (typeof firstChoice !== "object" || firstChoice === null) {
		return "";
	}

	const message = (firstChoice as { message?: unknown }).message;
	if (typeof message !== "object" || message === null) {
		return "";
	}

	return normalizeMessageText((message as { content?: unknown }).content);
}

function extractErrorMessageFromJson(data: Record<string, unknown> | null) {
	if (!data) {
		return undefined;
	}

	if (typeof data.message === "string" && data.message.trim()) {
		return data.message;
	}

	if (typeof data.error === "string" && data.error.trim()) {
		return data.error;
	}

	if (
		typeof data.error === "object" &&
		data.error !== null &&
		"message" in data.error &&
		typeof (data.error as { message?: unknown }).message === "string"
	) {
		return (data.error as { message: string }).message;
	}

	return undefined;
}

function createTextResponseStream(text: string) {
	const textPartId = crypto.randomUUID();

	return createUIMessageStream({
		execute: async ({ writer }) => {
			writer.write({
				type: "start",
				messageId: crypto.randomUUID(),
			});
			writer.write({ type: "start-step" });
			writer.write({
				type: "text-start",
				id: textPartId,
			});

			if (text) {
				writer.write({
					type: "text-delta",
					id: textPartId,
					delta: text,
				});
			}

			writer.write({
				type: "text-end",
				id: textPartId,
			});
			writer.write({ type: "finish-step" });
			writer.write({
				type: "finish",
				finishReason: "stop",
			});
		},
	});
}

export async function POST(req: Request) {
	let body: ChatRequestBody;

	try {
		body = (await req.json()) as ChatRequestBody;
	} catch {
		return jsonErrorResponse("Malformed JSON in request body", 400);
	}

	const {
		messages,
		model,
		apiKey,
		image_config,
		reasoning_effort,
		web_search,
		is_image_gen,
	}: ChatRequestBody = body;

	if (!messages || !Array.isArray(messages)) {
		return jsonErrorResponse("Missing messages", 400);
	}

	const headerApiKey = req.headers.get("x-llmgateway-key") ?? undefined;
	const headerModel = req.headers.get("x-llmgateway-model") ?? undefined;
	const noFallbackHeader = req.headers.get("x-no-fallback") ?? undefined;
	const finalApiKey = apiKey ?? headerApiKey;

	console.info(`${ROUTE_DEBUG_PREFIX} incoming request`, {
		hasMessages: Array.isArray(messages),
		messageCount: Array.isArray(messages) ? messages.length : 0,
		model,
		headerModel,
		hasApiKeyInBody: typeof apiKey === "string" && apiKey.length > 0,
		hasApiKeyInHeader:
			typeof headerApiKey === "string" && headerApiKey.length > 0,
		hasFinalApiKey: typeof finalApiKey === "string" && finalApiKey.length > 0,
		reasoning_effort,
		web_search: web_search === true,
		is_image_gen: is_image_gen === true,
	});

	if (!finalApiKey) {
		return jsonErrorResponse("Missing API key", 400);
	}

	const selectedModel = (model ?? headerModel)?.trim();
	if (!selectedModel) {
		return jsonErrorResponse("Missing model", 400);
	}

	const gatewayUrl =
		process.env.GATEWAY_URL ??
		(process.env.NODE_ENV === "development"
			? "http://localhost:4001/v1"
			: "https://api.kiwillm.in/v1");

	console.info(`${ROUTE_DEBUG_PREFIX} resolved routing`, {
		selectedModel,
		gatewayUrl,
		noFallbackHeader,
	});

	if (is_image_gen) {
		try {
			const llmgateway = createLLMGateway({
				apiKey: finalApiKey,
				baseURL: gatewayUrl,
				headers: {
					"x-source": "chat.kiwillm.in",
					...(noFallbackHeader ? { "x-no-fallback": noFallbackHeader } : {}),
				},
				extraBody: {
					reasoning_effort,
					image_config,
					web_search,
				},
			}) as ReturnType<typeof createLLMGateway>;

			const lastUserMessage = [...messages]
				.reverse()
				.find((message) => message.role === "user");

			let prompt = "";
			const fileParts: { url: string; mediaType: string }[] = [];

			if (lastUserMessage) {
				prompt = lastUserMessage.parts
					.filter(
						(part): part is { type: "text"; text: string } =>
							part.type === "text",
					)
					.map((part) => part.text)
					.join("\n");

				for (const part of lastUserMessage.parts) {
					if (
						part.type === "file" &&
						"url" in part &&
						typeof part.url === "string" &&
						"mediaType" in part &&
						typeof part.mediaType === "string"
					) {
						fileParts.push({
							url: part.url,
							mediaType: part.mediaType,
						});
					}
				}
			}

			if (!prompt.trim()) {
				return jsonErrorResponse("Missing prompt for image generation", 400);
			}

			const result = await generateImage({
				model: llmgateway.image(selectedModel),
				prompt:
					fileParts.length > 0
						? { images: fileParts.map((file) => file.url), text: prompt }
						: prompt,
				n: image_config?.n ?? 1,
				...(image_config?.image_size
					? { size: image_config.image_size as `${number}x${number}` }
					: {}),
				...(image_config?.aspect_ratio && image_config.aspect_ratio !== "auto"
					? { aspectRatio: image_config.aspect_ratio }
					: {}),
			});

			const uiStream = createUIMessageStream({
				execute: async ({ writer }) => {
					writer.write({
						type: "start",
						messageId: crypto.randomUUID(),
					});
					writer.write({ type: "start-step" });

					for (const image of result.images) {
						const mediaType = image.mediaType || "image/png";
						writer.write({
							type: "file",
							url: `data:${mediaType};base64,${image.base64}`,
							mediaType,
						});
					}

					writer.write({ type: "finish-step" });
					writer.write({
						type: "finish",
						finishReason: "stop",
					});
				},
			});

			return createUIMessageStreamResponse({
				stream: uiStream,
				headers: {
					"cache-control": "no-cache",
					connection: "keep-alive",
					"x-accel-buffering": "no",
				},
			});
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Image generation failed";
			const status =
				typeof error === "object" &&
				error !== null &&
				"status" in error &&
				typeof (error as { status?: unknown }).status === "number"
					? (error as { status: number }).status
					: 500;

			console.error(`${ROUTE_DEBUG_PREFIX} image generation failed`, {
				status,
				message,
				selectedModel,
				error,
			});

			return jsonErrorResponse(message, status);
		}
	}

	try {
		const response = await fetch(`${gatewayUrl}/chat/completions`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${finalApiKey}`,
				"x-source": "chat.kiwillm.in",
				...(noFallbackHeader ? { "x-no-fallback": noFallbackHeader } : {}),
			},
			body: JSON.stringify({
				model: selectedModel,
				messages: toOpenAICompatibleMessages(messages),
				stream: false,
				...(reasoning_effort ? { reasoning_effort } : {}),
				...(web_search ? { web_search: true } : {}),
				...(image_config ? { image_config } : {}),
			}),
			cache: "no-store",
		});

		const responseText = await response.text();
		let responseJson: Record<string, unknown> | null = null;

		try {
			responseJson = responseText
				? (JSON.parse(responseText) as Record<string, unknown>)
				: null;
		} catch {
			responseJson = null;
		}

		if (!response.ok) {
			const message =
				extractErrorMessageFromJson(responseJson) ??
				responseText ??
				"KiwiLLM request failed";
			return jsonErrorResponse(message, response.status);
		}

		if (!responseJson) {
			return jsonErrorResponse(
				"KiwiLLM returned an invalid response body",
				502,
			);
		}

		const assistantText = extractAssistantTextFromResponse(responseJson);
		const uiStream = createTextResponseStream(assistantText);

		return createUIMessageStreamResponse({
			stream: uiStream,
			headers: {
				"cache-control": "no-cache",
				connection: "keep-alive",
				"x-accel-buffering": "no",
			},
		});
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "KiwiLLM request failed";

		console.error(`${ROUTE_DEBUG_PREFIX} chat request failed`, {
			message,
			error,
			selectedModel,
			gatewayUrl,
		});

		return jsonErrorResponse(message, 500);
	}
}
