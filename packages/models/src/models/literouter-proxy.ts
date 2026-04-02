import type {
	ModelDefinition,
	ProviderModelMapping,
} from "@/models.js";

const literouterProxyProviderId = "kiwillm-literouter-proxy" as const;

function createProxyMapping(
	modelName: string,
	overrides: Partial<ProviderModelMapping> = {},
): ProviderModelMapping {
	return {
		test: "skip",
		providerId: literouterProxyProviderId,
		modelName,
		inputPrice: 0,
		outputPrice: 0,
		requestPrice: 0,
		contextSize: 128000,
		maxOutput: 16384,
		streaming: true,
		vision: false,
		tools: true,
		jsonOutput: true,
		jsonOutputSchema: true,
		...overrides,
	};
}

function createProxyModel(
	id: string,
	family: ModelDefinition["family"],
	overrides: Partial<ModelDefinition> = {},
	mappingOverrides: Partial<ProviderModelMapping> = {},
): ModelDefinition {
	return {
		id,
		name: overrides.name,
		description: overrides.description,
		family,
		aliases: overrides.aliases,
		free: overrides.free,
		rateLimitKind: overrides.rateLimitKind,
		output: overrides.output,
		imageInputRequired: overrides.imageInputRequired,
		stability: overrides.stability,
		supportsSystemRole: overrides.supportsSystemRole,
		releasedAt: overrides.releasedAt,
		providers: [createProxyMapping(id, mappingOverrides)],
	};
}

export const literouterProxyProviderAugments: Record<
	string,
	ProviderModelMapping[]
> = {
	deepseek: [createProxyMapping("deepseek", { contextSize: 163840 })],
	glm: [createProxyMapping("glm", { reasoning: true })],
	"gpt-oss-120b": [
		createProxyMapping("gpt-oss-120b", {
			contextSize: 131072,
			reasoning: true,
		}),
	],
	"gpt-oss-20b": [
		createProxyMapping("gpt-oss-20b", {
			contextSize: 131072,
			reasoning: true,
		}),
	],
	"hermes-2-pro-llama-3-8b": [
		createProxyMapping("hermes-2-pro-llama-3-8b", {
			contextSize: 131072,
		}),
	],
	"kimi-k2.5": [
		createProxyMapping("kimi-k2.5", {
			contextSize: 131072,
			reasoning: true,
		}),
	],
	"llama-3-8b-instruct": [
		createProxyMapping("llama-3-8b-instruct", {
			contextSize: 131072,
		}),
	],
	"llama-3.1-8b-instruct": [
		createProxyMapping("llama-3.1-8b-instruct", {
			contextSize: 131072,
		}),
	],
	"llama-3.2-3b-instruct": [
		createProxyMapping("llama-3.2-3b-instruct", {
			contextSize: 131072,
		}),
	],
	"qwen3-32b": [
		createProxyMapping("qwen3-32b", {
			contextSize: 131072,
			reasoning: true,
		}),
	],
	"qwen3-4b-fp8": [
		createProxyMapping("qwen3-4b-fp8", {
			contextSize: 131072,
			reasoning: true,
		}),
	],
};

export const literouterProxyModels = [
	createProxyModel("deepseek-v3-0324", "deepseek", {
		name: "DeepSeek V3 0324",
		description: "DeepSeek V3 0324 exposed by the LiteRouter proxy.",
	}, {
		contextSize: 163840,
	}),
	createProxyModel("devstral", "mistral", {
		name: "Devstral",
		description: "Devstral exposed by the LiteRouter proxy.",
	}),
	createProxyModel("ernie-4.5-21b-a3b-thinking", "baidu", {
		name: "ERNIE 4.5 21B A3B Thinking",
		description:
			"ERNIE 4.5 21B A3B Thinking exposed by the LiteRouter proxy.",
	}, {
		reasoning: true,
	}),
	createProxyModel("gemini", "google", {
		name: "Gemini",
		description: "Gemini exposed by the LiteRouter proxy.",
	}, {
		contextSize: 1048576,
		vision: true,
	}),
	createProxyModel("gemma-3-27b-it", "google", {
		name: "Gemma 3 27B IT",
		description: "Gemma 3 27B IT exposed by the LiteRouter proxy.",
	}),
	createProxyModel("gemma", "google", {
		name: "Gemma",
		description: "Gemma exposed by the LiteRouter proxy.",
	}),
	createProxyModel("gpt", "openai", {
		name: "GPT",
		description: "GPT exposed by the LiteRouter proxy.",
	}, {
		vision: true,
		reasoning: true,
		webSearch: true,
	}),
	createProxyModel("kat-coder-pro", "openai", {
		name: "Kat Coder Pro",
		description: "Kat Coder Pro exposed by the LiteRouter proxy.",
	}, {
		reasoning: true,
	}),
	createProxyModel("l3-8b-lunaris", "meta", {
		name: "L3 8B Lunaris",
		description: "L3 8B Lunaris exposed by the LiteRouter proxy.",
	}),
	createProxyModel("l3-8b-stheno-v3.2", "meta", {
		name: "L3 8B Stheno V3.2",
		description: "L3 8B Stheno V3.2 exposed by the LiteRouter proxy.",
	}),
	createProxyModel("llama-3.1-8b-instruct-turbo", "meta", {
		name: "Llama 3.1 8B Instruct Turbo",
		description:
			"Llama 3.1 8B Instruct Turbo exposed by the LiteRouter proxy.",
	}),
	createProxyModel("llama", "meta", {
		name: "Llama",
		description: "Llama exposed by the LiteRouter proxy.",
	}),
	createProxyModel("mimo-v2-flash", "minimax", {
		name: "Mimo V2 Flash",
		description: "Mimo V2 Flash exposed by the LiteRouter proxy.",
	}),
	createProxyModel("ministral", "mistral", {
		name: "Ministral",
		description: "Ministral exposed by the LiteRouter proxy.",
	}),
	createProxyModel("mistral-nemo", "mistral", {
		name: "Mistral Nemo",
		description: "Mistral Nemo exposed by the LiteRouter proxy.",
	}),
	createProxyModel("mistral-small", "mistral", {
		name: "Mistral Small",
		description: "Mistral Small exposed by the LiteRouter proxy.",
	}),
	createProxyModel("nemotron-3-super-120b-a12b", "nvidia", {
		name: "Nemotron 3 Super 120B A12B",
		description:
			"Nemotron 3 Super 120B A12B exposed by the LiteRouter proxy.",
	}),
	createProxyModel("nemotron", "nvidia", {
		name: "Nemotron",
		description: "Nemotron exposed by the LiteRouter proxy.",
	}),
	createProxyModel("qwen", "alibaba", {
		name: "Qwen",
		description: "Qwen exposed by the LiteRouter proxy.",
	}, {
		reasoning: true,
	}),
	createProxyModel("step-3.5-flash", "stepfun", {
		name: "Step 3.5 Flash",
		description: "Step 3.5 Flash exposed by the LiteRouter proxy.",
	}),
	createProxyModel("trinity", "openrouter", {
		name: "Trinity",
		description: "Trinity exposed by the LiteRouter proxy.",
	}),
	createProxyModel("trinity-large-preview", "openrouter", {
		name: "Trinity Large Preview",
		description: "Trinity Large Preview exposed by the LiteRouter proxy.",
	}),
] as const satisfies ModelDefinition[];
