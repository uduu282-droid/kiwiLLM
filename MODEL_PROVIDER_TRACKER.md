# Model Provider Tracker

This file tracks worker-backed and custom provider integrations added to KiwiLLM.

## Conventions

- `Provider`: internal provider id used in the catalog/runtime
- `Upstream`: external worker or proxy base URL
- `Status`:
  - `Live` means pushed to `main`
  - `Local` means only present in the local worktree
- `Catalog`:
  - `Mapped` means the model already existed and we added our provider mapping
  - `Created` means we added a new internal model definition
- `Runtime`:
  - `OpenAI-compatible` means it works through `/v1/models` and `/v1/chat/completions`
  - `No-auth` means the upstream does not require a provider API key

## Qwen

- Provider: `kiwillm-qwen`
- Upstream: `https://qwen-worker-proxy.ronitshrimankar1.workers.dev`
- Status: `Live`
- Runtime: `OpenAI-compatible`, `No-auth`, zero-cost routing enabled

### Models

| Model ID | Catalog | Upstream Model | Test Status | Notes |
| --- | --- | --- | --- | --- |
| `qwen3-coder-plus` | Mapped | `qwen3-coder-plus` | Working | Live via KiwiLLM API |
| `qwen3-coder-flash` | Mapped | `qwen3-coder-flash` | Working | Live via KiwiLLM API, streaming verified |

### Notes

- This was the first worker-backed provider fully verified through `api.kiwillm.in`.
- Routing was updated so these models do not require org credits.

## Kimi

- Provider: `kiwillm-kimi`
- Upstream: `https://kimi-k2.qwen4346.workers.dev`
- Status: `Live`
- Runtime: `OpenAI-compatible`, `No-auth`

### Models

| Model ID | Catalog | Upstream Model | Test Status | Notes |
| --- | --- | --- | --- | --- |
| `kimi-k2.5` | Mapped | `kimi-k2.5` | Working | Added as verified model |
| `kimi-k2-thinking` | Mapped | `kimi-k2-thinking` | Working | Added as verified model |
| `kimi-k2-0905` | Not added | `kimi-k2-0905` | Not clean | Returned empty content during testing |

## DeepSeek

- Provider: `kiwillm-deepseek`
- Upstream: `https://deepseek-chat-proxy.deepseekrev1.workers.dev`
- Status: `Live`
- Runtime: `OpenAI-compatible`, `No-auth`

### Models

| Model ID | Catalog | Upstream Model | Test Status | Notes |
| --- | --- | --- | --- | --- |
| `deepseek-chat` | Created | `deepseek-chat` | Working | Added after OpenAI-compatible worker update |
| `deepseek-reasoner` | Created | `deepseek-reasoner` | Working | Added after OpenAI-compatible worker update |
| `deepseek-v3.2-exp` | Created | `deepseek-v3.2-exp` | Working | |
| `deepseek-v3.2` | Mapped | `deepseek-v3.2` | Working | Existing internal model |
| `deepseek-v3` | Mapped | `deepseek-v3` | Working | Existing internal model |
| `deepseek-vl` | Created | `deepseek-vl` | Working | |
| `deepseek-v2` | Created | `deepseek-v2` | Working | |
| `deepseek-v2.5` | Created | `deepseek-v2.5` | Working | |
| `deepseek-math` | Created | `deepseek-math` | Working | |
| `deepseek-coder` | Created | `deepseek-coder` | Working | |
| `deepseek-instruct` | Created | `deepseek-instruct` | Working | |
| `deepseek-r1` | Created | `deepseek-r1` | Working | |
| `deepseek-llm` | Created | `deepseek-llm` | Working | |
| `deepseek-moe` | Created | `deepseek-moe` | Working | |
| `deepseek-67b` | Created | `deepseek-67b` | Working | |
| `deepseek-33b` | Created | `deepseek-33b` | Working | |

### Notes

- Early tests failed when the worker was not OpenAI-compatible.
- Integration moved forward only after `/v1/models` and `/v1/chat/completions` were working cleanly.

## MiniMax

- Provider: `kiwillm-minimax`
- Upstream: `https://minimax-ai-proxy.revai.workers.dev`
- Status: `Live`
- Runtime: `OpenAI-compatible`, `No-auth`

### Models

| Model ID | Catalog | Upstream Model | Test Status | Notes |
| --- | --- | --- | --- | --- |
| `minimax-m2` | Mapped | `MiniMax-M2` | Working | Existing internal model |
| `minimax-m1` | Created | `MiniMax-M1` | Working | New internal model added |
| `minimax-text-01` | Mapped | `MiniMax-Text-01` | Working | Existing internal model |

## Free AI Hub

- Provider: `kiwillm-free-ai-hub`
- Upstream: `https://free-ai-hub.revai.workers.dev`
- Status: `Live`
- Runtime: `OpenAI-compatible`, `No-auth`

### Summary

- Total mapped models: `34`
- This provider is a mixed external hub across multiple families.
- We verified representative models across Anthropic, OpenAI, Google, MiniMax, and DeepSeek families.

### Representative verified tests

| Upstream Model | Test Status | Notes |
| --- | --- | --- |
| `anthropic/claude-3.5-sonnet` | Working | Representative Anthropic test |
| `openai/gpt-5-nano` | Working | Representative OpenAI test |
| `google/gemini-3.1-flash-lite-preview` | Working | Representative Google test |
| `minimax/minimax-m2` | Working | Representative MiniMax test |
| `deepseek/deepseek-chat-v3-0324` | Working | Representative DeepSeek test |

### Catalog notes

- Existing internal Anthropic, OpenAI, Google, MiniMax, and DeepSeek models were mapped where possible.
- Missing internal model definitions were created only where needed to represent upstream IDs cleanly.

## Rejected or Deferred Providers

These were tested but intentionally not added, or only partially added.

### GPTFree proxy

- Upstream: `https://gptfree-3tfd.onrender.com`
- Status: `Rejected`
- Reason: `/v1/models` worked, but completions returned app-level paid-plan errors instead of usable output

### Early DeepSeek form worker

- Upstream: `https://deepseek-chat-proxy.deepseekrev1.workers.dev/chat`
- Status: `Superseded`
- Reason: worked through multipart form API, but was replaced by the OpenAI-compatible version before integration

### Early MiniMax worker

- Upstream: `https://minimax-proxy.qwen4346.workers.dev`
- Status: `Rejected`
- Reason: model listing/health was broken and completions failed with JSON parse errors

### Free AI Hub caution

- Status: `Live with caution`
- Reason: this is a multi-provider external hub, not a single dedicated upstream
- Recommendation: keep monitoring stability and output quality before relying on it heavily

## N33 AI

- Provider: `kiwillm-n33-ai`
- Upstream: `https://n33-ai.qwen4346.workers.dev`
- Status: `Local`
- Runtime: `OpenAI-compatible`, `No-auth`

### Models

| Model ID | Catalog | Upstream Model | Test Status | Notes |
| --- | --- | --- | --- | --- |
| `sonar` | Mapped | `sonar` | Working | Returned clean JSON with `stream: false` |
| `sonar-pro` | Mapped | `sonar-pro` | Working | Returned clean JSON with `stream: false` |
| `grok-4-1-fast` | Mapped | `grok-4.1-fast` | Working | Added against existing Grok 4.1 Fast model |
| `claude-haiku-4-5` | Mapped | `claude-haiku-4.5` | Working | Added against existing Claude Haiku 4.5 model |
| `claude-sonnet-4-5` | Mapped | `claude-sonnet-4.5` | Working | Added against existing Claude Sonnet 4.5 model |
| `gemini-3-flash` | Created | `gemini-3-flash` | Working | New internal model added |
| `gemini-3-pro` | Created | `gemini-3-pro` | Working | New internal model added |

### Deferred

| Upstream Model | Status | Reason |
| --- | --- | --- |
| `gpt-5.2` | Deferred | Returned empty body consistently |
| `claude-opus-4.5` | Deferred | Returned a long unrelated refusal/search-style response instead of the requested test output |

## Claude TalkAI

- Provider: `kiwillm-claude-talkai`
- Upstream: `https://claude-talkai.ronitshrimankar1.workers.dev`
- Status: `Local`
- Runtime: `OpenAI-compatible`, `No-auth`

### Models

| Model ID | Catalog | Upstream Model | Test Status | Notes |
| --- | --- | --- | --- | --- |
| `claude-3-5-sonnet-20241022` | Mapped | `claude-3-5-sonnet-20241022` | Working | Existing Anthropic model |
| `claude-3-5-haiku-20241022` | Mapped | `claude-3-5-haiku-20241022` | Working | Existing Anthropic model |
| `claude-3-5-sonnet-reasoning` | Created | `claude-3-5-sonnet-reasoning` | Working | New reasoning-tuned Claude entry |
| `claude-3-opus` | Mapped | `claude-3-opus-20240229` | Working | Existing Anthropic model |
| `claude-3-sonnet-20240229` | Created | `claude-3-sonnet-20240229` | Working | New dated Claude 3 Sonnet snapshot |
| `claude-3-haiku-20240307` | Mapped | `claude-3-haiku-20240307` | Working | Existing Anthropic model |
| `gpt-4o` | Mapped | `gpt-4o` | Working | Existing OpenAI model |
| `gpt-4o-mini` | Mapped | `gpt-4o-mini` | Working | Existing OpenAI model |
| `chatgpt-4o-latest` | Created | `chatgpt-4o-latest` | Working | New OpenAI snapshot |
| `gpt-4-turbo` | Mapped | `gpt-4-turbo` | Working | Existing OpenAI model |
| `gpt-4-turbo-preview` | Created | `gpt-4-turbo-preview` | Working | New OpenAI preview snapshot |
| `gpt-4` | Mapped | `gpt-4` | Working | Existing OpenAI model |
| `gpt-4-32k` | Created | `gpt-4-32k` | Working | New legacy GPT-4 snapshot |
| `gpt-4-vision-preview` | Created | `gpt-4-vision-preview` | Working | New multimodal GPT-4 snapshot |
| `gpt-3.5-turbo` | Mapped | `gpt-3.5-turbo` | Working | Existing OpenAI model |
| `gpt-3.5-turbo-0125` | Created | `gpt-3.5-turbo-0125` | Working | New dated GPT-3.5 snapshot |
| `o1` | Mapped | `o1` | Working | Existing reasoning model |
| `o1-mini` | Mapped | `o1-mini` | Working | Existing reasoning model |
| `o1-preview` | Created | `o1-preview` | Working | New preview reasoning snapshot |
| `o3-mini` | Mapped | `o3-mini` | Working | Existing reasoning model |
| `deepseek-r1` | Mapped | `deepseek-r1` | Working | Existing DeepSeek model |
| `deepseek-reasoner` | Mapped | `deepseek-reasoner` | Working | Existing DeepSeek model |
| `claude-2` | Created | `claude-2` | Working | New legacy Claude snapshot |
| `claude-instant` | Created | `claude-instant` | Working | New legacy Claude Instant snapshot |

## Recommended Tracking Workflow

For future providers and models:

1. Test upstream health
2. Test `/v1/models`
3. Test real completions
4. Only then add catalog mappings
5. Record provider, model IDs, and test result in this file
