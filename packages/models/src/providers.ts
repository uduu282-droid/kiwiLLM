export interface ProviderEnvConfig {
	required: {
		apiKey?: string;
		[key: string]: string | undefined;
	};
	optional?: Record<string, string>;
}

export interface ProviderDefinition {
	id: string;
	name: string;
	description: string;
	// Environment variable configuration
	env: ProviderEnvConfig;
	// Whether the provider supports streaming
	streaming?: boolean;
	// Whether the provider supports request cancellation
	cancellation?: boolean;
	// Color used for UI representation (hex code)
	color?: string;
	// Website URL
	website?: string | null;
	// Announcement text
	announcement?: string | null;
	// Instructions for creating an API key
	apiKeyInstructions?: string;
	// Learn more URL for API key creation
	learnMore?: string;
	// Priority weight for routing (default: 1). Lower values deprioritize the provider.
	// e.g., 0.8 means 20% lower priority (score multiplied by 1/0.8 = 1.25)
	priority?: number;
}

const brandName = process.env.BRAND_NAME ?? "KiwiLLM";
const siteUrl = process.env.SITE_URL ?? "https://kiwillm.in";
const docsUrl = process.env.DOCS_URL?.replace(
	"https://docs.llmgateway.io",
	"https://kiwillm.in",
);
const awsBedrockLearnMore = docsUrl
	? `${docsUrl}/integrations/aws-bedrock`
	: siteUrl;
const azureLearnMore = docsUrl ? `${docsUrl}/integrations/azure` : siteUrl;

export const providers = [
	{
		id: "llmgateway",
		name: brandName,
		description:
			"KiwiLLM is a unified platform for routing and managing large language model workloads.",
		env: {
			required: {
				apiKey: "LLM_LLMGATEWAY_API_KEY",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#6366f1",
		website: siteUrl,
		announcement: null,
	},
	{
		id: "kiwillm-completions-me",
		name: "KiwiLLM Completions.me",
		description:
			"KiwiLLM-hosted completions.me proxy exposing OpenAI-compatible chat models.",
		env: {
			required: {
				apiKey: "LLM_KIWILLM_COMPLETIONS_ME_API_KEY",
			},
			optional: {
				baseUrl: "LLM_KIWILLM_COMPLETIONS_ME_BASE_URL",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#2563eb",
		website: siteUrl,
		announcement: null,
	},
	{
		id: "kiwillm-ish-chat-proxy",
		name: "KiwiLLM Ish Chat Proxy",
		description:
			"KiwiLLM-hosted ish-chat proxy exposing OpenAI-compatible Grok and GPT OSS models.",
		env: {
			required: {},
			optional: {
				baseUrl: "LLM_KIWILLM_ISH_CHAT_PROXY_BASE_URL",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#2563eb",
		website: siteUrl,
		announcement: null,
	},
	{
		id: "kiwillm-freecfmodels",
		name: "KiwiLLM Free CF Models",
		description:
			"KiwiLLM-hosted Cloudflare-compatible worker exposing confirmed-safe chat and image models.",
		env: {
			required: {},
			optional: {
				baseUrl: "LLM_KIWILLM_FREECFMODELS_BASE_URL",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#1d4ed8",
		website: siteUrl,
		announcement: null,
	},
	{
		id: "kiwillm-chatai-proxy",
		name: "KiwiLLM ChatAI Proxy",
		description:
			"KiwiLLM-hosted multi-provider ChatAI proxy exposing OpenAI-compatible chat models.",
		env: {
			required: {},
			optional: {
				baseUrl: "LLM_KIWILLM_CHATAI_PROXY_BASE_URL",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#2563eb",
		website: siteUrl,
		announcement: null,
	},
	{
		id: "kiwillm-literouter-proxy",
		name: "KiwiLLM LiteRouter Proxy",
		description:
			"KiwiLLM-hosted LiteRouter proxy exposing OpenAI-compatible chat models.",
		env: {
			required: {},
			optional: {
				baseUrl: "LLM_KIWILLM_LITEROUTER_PROXY_BASE_URL",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#0f766e",
		website: siteUrl,
		announcement: null,
	},
	{
		id: "kiwillm-qwen",
		name: "KiwiLLM Qwen",
		description:
			"KiwiLLM-hosted Qwen models exposed through our OpenAI-compatible worker.",
		env: {
			required: {},
			optional: {
				baseUrl: "LLM_KIWILLM_QWEN_BASE_URL",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#2563eb",
		website: siteUrl,
		announcement: null,
	},
	{
		id: "kiwillm-kimi",
		name: "KiwiLLM Kimi",
		description:
			"KiwiLLM-hosted Moonshot Kimi models exposed through our OpenAI-compatible worker.",
		env: {
			required: {},
			optional: {
				baseUrl: "LLM_KIWILLM_KIMI_BASE_URL",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#111827",
		website: siteUrl,
		announcement: null,
	},
	{
		id: "kiwillm-deepseek",
		name: "KiwiLLM DeepSeek",
		description:
			"KiwiLLM-hosted DeepSeek models exposed through our OpenAI-compatible worker.",
		env: {
			required: {},
			optional: {
				baseUrl: "LLM_KIWILLM_DEEPSEEK_BASE_URL",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#2563eb",
		website: siteUrl,
		announcement: null,
	},
	{
		id: "kiwillm-minimax",
		name: "KiwiLLM MiniMax",
		description:
			"KiwiLLM-hosted MiniMax models exposed through our OpenAI-compatible worker.",
		env: {
			required: {},
			optional: {
				baseUrl: "LLM_KIWILLM_MINIMAX_BASE_URL",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#2563eb",
		website: siteUrl,
		announcement: null,
	},
	{
		id: "kiwillm-free-ai-hub",
		name: "KiwiLLM Free AI Hub",
		description:
			"KiwiLLM-hosted mixed-provider model hub exposed through our OpenAI-compatible worker.",
		env: {
			required: {},
			optional: {
				baseUrl: "LLM_KIWILLM_FREE_AI_HUB_BASE_URL",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#2563eb",
		website: siteUrl,
		announcement: null,
	},
	{
		id: "kiwillm-n33-ai",
		name: "KiwiLLM N33 AI",
		description:
			"KiwiLLM-hosted mixed model worker exposed through our OpenAI-compatible worker.",
		env: {
			required: {},
			optional: {
				baseUrl: "LLM_KIWILLM_N33_AI_BASE_URL",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#2563eb",
		website: siteUrl,
		announcement: null,
	},
	{
		id: "kiwillm-svelte-ai-enhanced",
		name: "KiwiLLM Svelte AI Enhanced",
		description:
			"KiwiLLM-hosted enhanced mixed-model worker exposed through an OpenAI-compatible endpoint.",
		env: {
			required: {},
			optional: {
				baseUrl: "LLM_KIWILLM_SVELTE_AI_ENHANCED_BASE_URL",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#2563eb",
		website: siteUrl,
		announcement: null,
	},
	{
		id: "kiwillm-openrouter-ai-hub",
		name: "KiwiLLM OpenRouter AI Hub",
		description:
			"KiwiLLM-hosted OpenRouter-backed mixed-model worker exposed through an OpenAI-compatible endpoint.",
		env: {
			required: {},
			optional: {
				baseUrl: "LLM_KIWILLM_OPENROUTER_AI_HUB_BASE_URL",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#2563eb",
		website: siteUrl,
		announcement: null,
	},
	{
		id: "kiwillm-claude-talkai",
		name: "KiwiLLM Claude TalkAI",
		description:
			"KiwiLLM-hosted Claude TalkAI worker exposing Anthropic, OpenAI, and DeepSeek models through an OpenAI-compatible endpoint.",
		env: {
			required: {},
			optional: {
				baseUrl: "LLM_KIWILLM_CLAUDE_TALKAI_BASE_URL",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#2563eb",
		website: siteUrl,
		announcement: null,
	},
	{
		id: "kiwillm-chatbot-ai",
		name: "KiwiLLM Chatbot AI",
		description:
			"KiwiLLM-hosted legacy OpenAI model worker exposed through an OpenAI-compatible endpoint.",
		env: {
			required: {},
			optional: {
				baseUrl: "LLM_KIWILLM_CHATBOT_AI_BASE_URL",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#2563eb",
		website: siteUrl,
		announcement: null,
	},
	{
		id: "kiwillm-cerebras-ai",
		name: "KiwiLLM Cerebras AI",
		description:
			"KiwiLLM-hosted Cerebras worker exposing selected OpenAI-compatible models.",
		env: {
			required: {},
			optional: {
				baseUrl: "LLM_KIWILLM_CEREBRAS_AI_BASE_URL",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#2563eb",
		website: siteUrl,
		announcement: null,
	},
	{
		id: "kiwillm-grok-proxy",
		name: "KiwiLLM Grok Proxy",
		description:
			"KiwiLLM-hosted Grok proxy worker exposing selected OpenAI-compatible models.",
		env: {
			required: {},
			optional: {
				baseUrl: "LLM_KIWILLM_GROK_PROXY_BASE_URL",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#2563eb",
		website: siteUrl,
		announcement: null,
	},
	{
		id: "kiwillm-gpt-oss-worker",
		name: "KiwiLLM GPT OSS Worker",
		description:
			"KiwiLLM-hosted GPT OSS worker exposing selected OpenAI-compatible models.",
		env: {
			required: {},
			optional: {
				baseUrl: "LLM_KIWILLM_GPT_OSS_WORKER_BASE_URL",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#2563eb",
		website: siteUrl,
		announcement: null,
	},
	{
		id: "kiwillm-claude-v3xg",
		name: "KiwiLLM Claude V3XG",
		description:
			"KiwiLLM-hosted Claude V3XG worker exposing selected chat-completions-compatible models.",
		env: {
			required: {},
			optional: {
				baseUrl: "LLM_KIWILLM_CLAUDE_V3XG_BASE_URL",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#2563eb",
		website: siteUrl,
		announcement: null,
	},
	{
		id: "openai",
		name: "OpenAI",
		description:
			"OpenAI is an AI research and deployment company. Our mission is to ensure that artificial general intelligence benefits all of humanity.",
		env: {
			required: {
				apiKey: "LLM_OPENAI_API_KEY",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#0ea5e9",
		website: "https://openai.com",
		announcement: null,
	},
	{
		id: "anthropic",
		name: "Anthropic",
		description:
			"Anthropic is a research and deployment company focused on building safe and useful AI.",
		env: {
			required: {
				apiKey: "LLM_ANTHROPIC_API_KEY",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#8b5cf6",
		website: "https://anthropic.com",
		announcement: null,
	},
	{
		id: "google-ai-studio",
		name: "Google AI Studio",
		description:
			"Google AI Studio is a platform for accessing Google's Gemini models.",
		env: {
			required: {
				apiKey: "LLM_GOOGLE_AI_STUDIO_API_KEY",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#4285f4",
		website: "https://ai.google.com",
		announcement: null,
		priority: 0.8,
	},
	{
		id: "google-vertex",
		name: "Google Vertex AI",
		description:
			"Google Vertex AI is a platform for accessing Google's Gemini models via Vertex AI.",
		env: {
			required: {
				apiKey: "LLM_GOOGLE_VERTEX_API_KEY",
				project: "LLM_GOOGLE_CLOUD_PROJECT",
			},
			optional: {
				region: "LLM_GOOGLE_VERTEX_REGION",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#4285f4",
		website: "https://cloud.google.com/vertex-ai",
		announcement: null,
	},
	{
		id: "obsidian",
		name: "Obsidian",
		description: "Obsidian - Google-compatible LLM provider.",
		env: {
			required: {
				apiKey: "LLM_OBSIDIAN_API_KEY",
				baseUrl: "LLM_OBSIDIAN_BASE_URL",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#1a1a1a",
		website: null,
		announcement: null,
	},
	{
		id: "groq",
		name: "Groq",
		description: "Groq's ultra-fast LPU inference with various models",
		env: {
			required: {
				apiKey: "LLM_GROQ_API_KEY",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#F55036",
		website: "https://groq.com",
		announcement: null,
	},
	{
		id: "cerebras",
		name: "Cerebras",
		description:
			"Cerebras high-performance inference with ultra-fast throughput",
		env: {
			required: {
				apiKey: "LLM_CEREBRAS_API_KEY",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#6b46c1",
		website: "https://cerebras.ai",
		announcement: null,
	},
	{
		id: "xai",
		name: "xAI",
		description: "xAI's Grok large language models",
		env: {
			required: {
				apiKey: "LLM_X_AI_API_KEY",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#000000",
		website: "https://x.ai",
		announcement: null,
	},
	{
		id: "deepseek",
		name: "DeepSeek",
		description:
			"DeepSeek's high-performance language models with OpenAI-compatible API",
		env: {
			required: {
				apiKey: "LLM_DEEPSEEK_API_KEY",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#FF6B00",
		website: "https://deepseek.com",
		announcement: null,
	},
	{
		id: "alibaba",
		name: "Alibaba Cloud",
		description:
			"Alibaba Cloud's Qwen large language models with OpenAI-compatible API",
		env: {
			required: {
				apiKey: "LLM_ALIBABA_API_KEY",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#FF6A00",
		website: "https://www.alibabacloud.com",
		announcement: null,
	},
	{
		id: "novita",
		name: "NovitaAI",
		description: "NovitaAI's OpenAI-compatible large language models",
		env: {
			required: {
				apiKey: "LLM_NOVITA_AI_API_KEY",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#9333ea",
		website: "https://novita.ai",
		announcement: null,
	},
	{
		id: "aws-bedrock",
		name: "AWS Bedrock",
		description: "Amazon Bedrock - fully managed service for foundation models",
		env: {
			required: {
				apiKey: "LLM_AWS_BEDROCK_API_KEY",
			},
			optional: {
				baseUrl: "LLM_AWS_BEDROCK_BASE_URL",
				region: "LLM_AWS_BEDROCK_REGION",
			},
		},
		priority: 0.9,
		streaming: true,
		cancellation: true,
		color: "#FF9900",
		website: "https://aws.amazon.com/bedrock",
		announcement: null,
		apiKeyInstructions:
			"Use AWS Bedrock Long-Term API Keys (not IAM service account or private keys)",
		learnMore: awsBedrockLearnMore,
	},
	{
		id: "azure",
		name: "Azure",
		description: "Microsoft Azure - enterprise-grade OpenAI models",
		env: {
			required: {
				apiKey: "LLM_AZURE_API_KEY",
				resource: "LLM_AZURE_RESOURCE",
			},
			optional: {
				deploymentType: "LLM_AZURE_DEPLOYMENT_TYPE",
				apiVersion: "LLM_AZURE_API_VERSION",
				useResponsesApi: "LLM_AZURE_USE_RESPONSES_API",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#0078D4",
		website:
			"https://azure.microsoft.com/en-us/products/ai-services/openai-service",
		announcement: null,
		apiKeyInstructions:
			"The resource name can be found in your Azure base URL: https://<resource-name>.openai.azure.com",
		learnMore: azureLearnMore,
	},
	{
		id: "zai",
		name: "Z AI",
		description: "Z AI's OpenAI-compatible large language models",
		env: {
			required: {
				apiKey: "LLM_Z_AI_API_KEY",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#22c55e",
		website: "https://z.ai",
		announcement: null,
	},
	{
		id: "moonshot",
		name: "Moonshot AI",
		description: "Moonshot AI's OpenAI-compatible large language models",
		env: {
			required: {
				apiKey: "LLM_MOONSHOT_API_KEY",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#4B9EFF",
		website: "https://moonshot.ai",
		announcement: null,
	},
	{
		id: "perplexity",
		name: "Perplexity",
		description:
			"Perplexity's AI models for search and conversation with real-time web access",
		env: {
			required: {
				apiKey: "LLM_PERPLEXITY_API_KEY",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#20B2AA",
		website: "https://perplexity.ai",
		announcement: null,
	},
	{
		id: "nebius",
		name: "Nebius AI",
		description:
			"Nebius AI Studio - OpenAI-compatible API for large language models",
		env: {
			required: {
				apiKey: "LLM_NEBIUS_API_KEY",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#3b82f6",
		website: "https://nebius.com",
		announcement: null,
	},
	{
		id: "mistral",
		name: "Mistral AI",
		description: "Mistral AI's large language models",
		env: {
			required: {
				apiKey: "LLM_MISTRAL_API_KEY",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#FF7000",
		website: "https://mistral.ai",
		announcement: null,
	},
	{
		id: "canopywave",
		name: "CanopyWave",
		description:
			"CanopyWave is a platform for running large language models with OpenAI-compatible API",
		env: {
			required: {
				apiKey: "LLM_CANOPY_WAVE_API_KEY",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#10b981",
		website: "https://canopywave.io",
		announcement: null,
	},
	{
		id: "inference.net",
		name: "Inference.net",
		description:
			"Inference.net is a platform for running large language models in the cloud.",
		env: {
			required: {
				apiKey: "LLM_INFERENCE_NET_API_KEY",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#10b981",
		website: "https://inference.net",
		announcement: null,
	},
	{
		id: "together.ai",
		name: "Together AI",
		description:
			"Together AI is a platform for running large language models in the cloud with fast inference.",
		env: {
			required: {
				apiKey: "LLM_TOGETHER_AI_API_KEY",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#ff6b35",
		website: "https://together.ai",
		announcement: null,
	},
	{
		id: "custom",
		name: "Custom",
		description: "Custom OpenAI-compatible provider with configurable base URL",
		env: {
			required: {},
		},
		streaming: true,
		cancellation: true,
		color: "#6b7280",
		website: null,
		announcement: null,
	},
	{
		id: "nanogpt",
		name: "NanoGPT",
		description: "NanoGPT offers a large selection of models",
		env: {
			required: {
				apiKey: "LLM_NANO_GPT_API_KEY",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#10b981",
		website: "https://nano-gpt.com",
		announcement: null,
	},
	{
		id: "bytedance",
		name: "ByteDance",
		description:
			"ByteDance's ModelArk platform with OpenAI-compatible API for large language models",
		env: {
			required: {
				apiKey: "LLM_BYTEDANCE_API_KEY",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#FF4757",
		website: "https://www.byteplus.com/en/product/modelark",
		announcement: null,
	},
	{
		id: "minimax",
		name: "MiniMax",
		description:
			"MiniMax's large language models with advanced reasoning and coding capabilities",
		env: {
			required: {
				apiKey: "LLM_MINIMAX_API_KEY",
			},
		},
		streaming: true,
		cancellation: true,
		color: "#7C3AED",
		website: "https://minimax.io",
		announcement: null,
	},
] as const satisfies ProviderDefinition[];

export type ProviderId = (typeof providers)[number]["id"];

export function getProviderDefinition(
	providerId: ProviderId | string,
): ProviderDefinition | undefined {
	return providers.find((p) => p.id === providerId);
}
