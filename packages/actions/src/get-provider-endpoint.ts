import {
	models,
	type ProviderModelMapping,
	type ProviderId,
	getProviderEnvValue,
	getProviderEnvConfig,
} from "@llmgateway/models";

import type { ProviderKeyOptions } from "@llmgateway/db";

/**
 * Get the endpoint URL for a provider API call
 */
export function getProviderEndpoint(
	provider: ProviderId,
	baseUrl?: string,
	model?: string,
	token?: string,
	stream?: boolean,
	supportsReasoning?: boolean,
	hasExistingToolCalls?: boolean,
	providerKeyOptions?: ProviderKeyOptions,
	configIndex?: number,
	imageGenerations?: boolean,
): string {
	let modelName = model;
	if (model && model !== "custom") {
		const modelInfo = models.find((m) => m.id === model);
		if (modelInfo) {
			const providerMapping = modelInfo.providers.find(
				(p) => p.providerId === provider,
			);
			if (providerMapping) {
				modelName = providerMapping.modelName;
			}
		}
	}
	let url: string | undefined;

	if (baseUrl) {
		url = baseUrl;
	} else {
		switch (provider) {
			case "llmgateway":
				if (model === "custom" || model === "auto") {
					// For custom model, use a default URL for testing
					url = "https://api.openai.com";
				} else {
					throw new Error(`Provider ${provider} requires a baseUrl`);
				}
				break;
			case "openai":
				url = "https://api.openai.com";
				break;
			case "kiwillm-qwen":
				url =
					getProviderEnvValue(
						"kiwillm-qwen",
						"baseUrl",
						configIndex,
						"https://qwen-worker-proxy.ronitshrimankar1.workers.dev",
					) ?? "https://qwen-worker-proxy.ronitshrimankar1.workers.dev";
				break;
			case "kiwillm-chatai-proxy":
				url =
					getProviderEnvValue(
						"kiwillm-chatai-proxy",
						"baseUrl",
						configIndex,
						"https://chatai-proxy.revai.workers.dev",
					) ?? "https://chatai-proxy.revai.workers.dev";
				break;
			case "kiwillm-completions-me":
				url =
					getProviderEnvValue(
						"kiwillm-completions-me",
						"baseUrl",
						configIndex,
						"https://completions.me/api/v1",
					) ?? "https://completions.me/api/v1";
				break;
			case "kiwillm-freecfmodels":
				url =
					getProviderEnvValue(
						"kiwillm-freecfmodels",
						"baseUrl",
						configIndex,
						"https://freecfmodels.bgmipro285.workers.dev",
					) ?? "https://freecfmodels.bgmipro285.workers.dev";
				break;
			case "kiwillm-literouter-proxy":
				url =
					getProviderEnvValue(
						"kiwillm-literouter-proxy",
						"baseUrl",
						configIndex,
						"https://literouter-proxy.revai.workers.dev",
					) ?? "https://literouter-proxy.revai.workers.dev";
				break;
			case "kiwillm-kimi":
				url =
					getProviderEnvValue(
						"kiwillm-kimi",
						"baseUrl",
						configIndex,
						"https://kimi-k2.qwen4346.workers.dev",
					) ?? "https://kimi-k2.qwen4346.workers.dev";
				break;
			case "kiwillm-deepseek":
				url =
					getProviderEnvValue(
						"kiwillm-deepseek",
						"baseUrl",
						configIndex,
						"https://deepseek-chat-proxy.deepseekrev1.workers.dev",
					) ?? "https://deepseek-chat-proxy.deepseekrev1.workers.dev";
				break;
			case "kiwillm-minimax":
				url =
					getProviderEnvValue(
						"kiwillm-minimax",
						"baseUrl",
						configIndex,
						"https://minimax-ai-proxy.revai.workers.dev",
					) ?? "https://minimax-ai-proxy.revai.workers.dev";
				break;
			case "kiwillm-free-ai-hub":
				url =
					getProviderEnvValue(
						"kiwillm-free-ai-hub",
						"baseUrl",
						configIndex,
						"https://free-ai-hub.revai.workers.dev",
					) ?? "https://free-ai-hub.revai.workers.dev";
				break;
			case "kiwillm-n33-ai":
				url =
					getProviderEnvValue(
						"kiwillm-n33-ai",
						"baseUrl",
						configIndex,
						"https://n33-ai.qwen4346.workers.dev",
					) ?? "https://n33-ai.qwen4346.workers.dev";
				break;
			case "kiwillm-claude-talkai":
				url =
					getProviderEnvValue(
						"kiwillm-claude-talkai",
						"baseUrl",
						configIndex,
						"https://claude-talkai.ronitshrimankar1.workers.dev",
					) ?? "https://claude-talkai.ronitshrimankar1.workers.dev";
				break;
			case "kiwillm-chatbot-ai":
				url =
					getProviderEnvValue(
						"kiwillm-chatbot-ai",
						"baseUrl",
						configIndex,
						"https://chatbot-ai.qwen4346.workers.dev",
					) ?? "https://chatbot-ai.qwen4346.workers.dev";
				break;
			case "kiwillm-cerebras-ai":
				url =
					getProviderEnvValue(
						"kiwillm-cerebras-ai",
						"baseUrl",
						configIndex,
						"https://cerebras-ai.qwen4346.workers.dev",
					) ?? "https://cerebras-ai.qwen4346.workers.dev";
				break;
			case "kiwillm-grok-proxy":
				url =
					getProviderEnvValue(
						"kiwillm-grok-proxy",
						"baseUrl",
						configIndex,
						"https://grok-proxy.qwen4346.workers.dev",
					) ?? "https://grok-proxy.qwen4346.workers.dev";
				break;
			case "kiwillm-gpt-oss-worker":
				url =
					getProviderEnvValue(
						"kiwillm-gpt-oss-worker",
						"baseUrl",
						configIndex,
						"https://gpt-oss-worker.llamai.workers.dev",
					) ?? "https://gpt-oss-worker.llamai.workers.dev";
				break;
			case "kiwillm-claude-v3xg":
				url =
					getProviderEnvValue(
						"kiwillm-claude-v3xg",
						"baseUrl",
						configIndex,
						"https://claude-v3xg.onrender.com",
					) ?? "https://claude-v3xg.onrender.com";
				break;
			case "anthropic":
				url = "https://api.anthropic.com";
				break;
			case "google-ai-studio":
				url = "https://generativelanguage.googleapis.com";
				break;
			case "google-vertex":
				url = "https://aiplatform.googleapis.com";
				break;
			case "obsidian":
				url = getProviderEnvValue("obsidian", "baseUrl", configIndex);
				if (!url) {
					throw new Error(
						"Obsidian provider requires LLM_OBSIDIAN_BASE_URL environment variable",
					);
				}
				break;
			case "inference.net":
				url = "https://api.inference.net";
				break;
			case "together.ai":
				url = "https://api.together.ai";
				break;
			case "mistral":
				url = "https://api.mistral.ai";
				break;
			case "xai":
				url = "https://api.x.ai";
				break;
			case "groq":
				url = "https://api.groq.com/openai";
				break;
			case "cerebras":
				url = "https://api.cerebras.ai";
				break;
			case "deepseek":
				url = "https://api.deepseek.com";
				break;
			case "perplexity":
				url = "https://api.perplexity.ai";
				break;
			case "novita":
				url = "https://api.novita.ai/v3/openai";
				break;
			case "moonshot":
				url = "https://api.moonshot.ai";
				break;
			case "alibaba":
				// Use different base URL for image generation vs chat completions
				if (imageGenerations) {
					url = "https://dashscope-intl.aliyuncs.com";
				} else {
					url = "https://dashscope-intl.aliyuncs.com/compatible-mode";
				}
				break;
			case "nebius":
				url = "https://api.studio.nebius.com";
				break;
			case "zai":
				url = "https://api.z.ai";
				break;
			case "nanogpt":
				url = "https://nano-gpt.com/api";
				break;
			case "bytedance":
				url = "https://ark.ap-southeast.bytepluses.com/api/v3";
				break;
			case "minimax":
				url = "https://api.minimax.io";
				break;
			case "aws-bedrock":
				url =
					getProviderEnvValue(
						"aws-bedrock",
						"baseUrl",
						configIndex,
						"https://bedrock-runtime.us-east-1.amazonaws.com",
					) ?? "https://bedrock-runtime.us-east-1.amazonaws.com";
				break;
			case "azure": {
				const resource =
					providerKeyOptions?.azure_resource ??
					getProviderEnvValue("azure", "resource", configIndex);

				if (!resource) {
					const azureEnv = getProviderEnvConfig("azure");
					throw new Error(
						`Azure resource is required - set via provider options or ${azureEnv?.required.resource ?? "LLM_AZURE_RESOURCE"} env var`,
					);
				}
				url = `https://${resource}.openai.azure.com`;
				break;
			}
			case "canopywave":
				url = "https://inference.canopywave.io";
				break;
			case "custom":
				if (!baseUrl) {
					throw new Error(`Custom provider requires a baseUrl`);
				}
				url = baseUrl;
				break;
			default:
				throw new Error(`Provider ${provider} requires a baseUrl`);
		}
	}

	if (!url) {
		throw new Error(`Failed to determine base URL for provider ${provider}`);
	}

	switch (provider) {
		case "anthropic":
			return `${url}/v1/messages`;
		case "google-ai-studio": {
			const endpoint = stream ? "streamGenerateContent" : "generateContent";
			const baseEndpoint = modelName
				? `${url}/v1beta/models/${modelName}:${endpoint}`
				: `${url}/v1beta/models/gemini-2.0-flash:${endpoint}`;
			const queryParams = [];
			if (token) {
				queryParams.push(`key=${token}`);
			}
			if (stream) {
				queryParams.push("alt=sse");
			}
			return queryParams.length > 0
				? `${baseEndpoint}?${queryParams.join("&")}`
				: baseEndpoint;
		}
		case "obsidian": {
			const endpoint = stream ? "streamGenerateContent" : "generateContent";
			const baseEndpoint = modelName
				? `${url}/v1beta/models/${modelName}:${endpoint}`
				: `${url}/v1beta/models/gemini-3-pro-image-preview:${endpoint}`;
			const queryParams = [];
			if (stream) {
				queryParams.push("alt=sse");
			}
			return queryParams.length > 0
				? `${baseEndpoint}?${queryParams.join("&")}`
				: baseEndpoint;
		}
		case "google-vertex": {
			const endpoint = stream ? "streamGenerateContent" : "generateContent";
			const model = modelName ?? "gemini-2.5-flash-lite";

			// Special handling for some models which require a non-global location
			let baseEndpoint: string;
			if (
				model === "gemini-2.0-flash-lite" ||
				model === "gemini-2.5-flash-lite"
			) {
				baseEndpoint = `${url}/v1/publishers/google/models/${model}:${endpoint}`;
			} else {
				const projectId = getProviderEnvValue(
					"google-vertex",
					"project",
					configIndex,
				);

				const region =
					getProviderEnvValue(
						"google-vertex",
						"region",
						configIndex,
						"global",
					) ?? "global";

				if (!projectId) {
					const vertexEnv = getProviderEnvConfig("google-vertex");
					throw new Error(
						`${vertexEnv?.required.project ?? "LLM_GOOGLE_CLOUD_PROJECT"} environment variable is required for Vertex model "${model}"`,
					);
				}

				baseEndpoint = `${url}/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:${endpoint}`;
			}

			const queryParams = [];
			if (token) {
				queryParams.push(`key=${token}`);
			}
			if (stream) {
				queryParams.push("alt=sse");
			}
			return queryParams.length > 0
				? `${baseEndpoint}?${queryParams.join("&")}`
				: baseEndpoint;
		}
		case "perplexity":
			return `${url}/chat/completions`;
		case "novita":
			return `${url}/chat/completions`;
		case "zai":
			if (imageGenerations) {
				return `${url}/api/paas/v4/images/generations`;
			}
			return `${url}/api/paas/v4/chat/completions`;
		case "aws-bedrock": {
			const prefix =
				providerKeyOptions?.aws_bedrock_region_prefix ??
				getProviderEnvValue("aws-bedrock", "region", configIndex, "global.") ??
				"global.";

			const endpoint = stream ? "converse-stream" : "converse";
			return `${url}/model/${prefix}${modelName}/${endpoint}`;
		}
		case "azure": {
			const deploymentType =
				providerKeyOptions?.azure_deployment_type ??
				getProviderEnvValue(
					"azure",
					"deploymentType",
					configIndex,
					"ai-foundry",
				) ??
				"ai-foundry";

			if (deploymentType === "openai") {
				// Traditional Azure (deployment-based)
				const apiVersion =
					providerKeyOptions?.azure_api_version ??
					getProviderEnvValue(
						"azure",
						"apiVersion",
						configIndex,
						"2024-10-21",
					) ??
					"2024-10-21";

				return `${url}/openai/deployments/${modelName}/chat/completions?api-version=${apiVersion}`;
			} else {
				// Azure AI Foundry (unified endpoint)
				const useResponsesApiEnv = getProviderEnvValue(
					"azure",
					"useResponsesApi",
					configIndex,
					"true",
				);

				if (model && useResponsesApiEnv !== "false") {
					const modelDef = models.find(
						(m) =>
							m.id === model ||
							m.providers.some(
								(p) => p.modelName === model && p.providerId === "azure",
							),
					);
					const providerMapping = modelDef?.providers.find(
						(p) => p.providerId === "azure",
					);
					const supportsResponsesApi =
						(providerMapping as ProviderModelMapping)?.supportsResponsesApi ===
						true;

					if (supportsResponsesApi) {
						return `${url}/openai/v1/responses`;
					}
				}
				return `${url}/openai/v1/chat/completions`;
			}
		}
		case "openai": {
			// Use responses endpoint for models that support responses API
			if (model) {
				// Look up by model ID first, then fall back to provider modelName
				const modelDef = models.find(
					(m) =>
						m.id === model ||
						m.providers.some(
							(p) => p.modelName === model && p.providerId === "openai",
						),
				);
				const providerMapping = modelDef?.providers.find(
					(p) => p.providerId === "openai",
				);
				const supportsResponsesApi =
					(providerMapping as ProviderModelMapping)?.supportsResponsesApi ===
					true;

				if (supportsResponsesApi) {
					return `${url}/v1/responses`;
				}
			}
			return `${url}/v1/chat/completions`;
		}
		case "kiwillm-qwen":
		case "kiwillm-chatai-proxy":
		case "kiwillm-completions-me":
		case "kiwillm-kimi":
		case "kiwillm-deepseek":
		case "kiwillm-minimax":
		case "kiwillm-free-ai-hub":
		case "kiwillm-n33-ai":
		case "kiwillm-claude-talkai":
		case "kiwillm-chatbot-ai":
		case "kiwillm-cerebras-ai":
		case "kiwillm-grok-proxy":
		case "kiwillm-gpt-oss-worker":
		case "kiwillm-claude-v3xg":
			return `${url}/v1/chat/completions`;
		case "alibaba":
			if (imageGenerations) {
				return `${url}/api/v1/services/aigc/multimodal-generation/generation`;
			}
			return `${url}/v1/chat/completions`;
		case "bytedance":
			if (imageGenerations) {
				return `${url}/images/generations`;
			}
			return `${url}/chat/completions`;
		case "xai":
			if (imageGenerations) {
				return `${url}/v1/images/generations`;
			}
			return `${url}/v1/chat/completions`;
		case "kiwillm-freecfmodels":
			if (imageGenerations) {
				return `${url}/v1/images/generations`;
			}
			return `${url}/v1/chat/completions`;
		case "inference.net":
		case "llmgateway":
		case "groq":
		case "cerebras":
		case "deepseek":
		case "moonshot":
		case "nebius":
		case "nanogpt":
		case "canopywave":
		case "minimax":
		case "custom":
		default:
			return `${url}/v1/chat/completions`;
	}
}
