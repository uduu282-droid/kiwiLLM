# Qwen Models Rollout

## Overview

This document tracks the KiwiLLM-hosted Qwen rollout in the model catalog and local development environment.

We started by integrating the Qwen worker-backed models exposed through:

- `https://qwen-worker-proxy.ronitshrimankar1.workers.dev`

Worker notes:

- Deployed worker URL: `https://qwen-worker-proxy.ronitshrimankar1.workers.dev`
- Reported capacity: `20,000 requests/day`
- Verified endpoints:
	- `GET /`
	- `GET /v1/models`
	- `POST /v1/chat/completions`

## Provider Added

We added a new provider to the shared model catalog:

- Provider ID: `kiwillm-qwen`
- Provider Name: `KiwiLLM Qwen`
- Description: `KiwiLLM-hosted Qwen models exposed through our OpenAI-compatible worker.`
- Website: `https://qwen-worker-proxy.ronitshrimankar1.workers.dev`
- Color: `#2563eb`
- Streaming: `true`
- Cancellation: `true`
- Runtime endpoint: `https://qwen-worker-proxy.ronitshrimankar1.workers.dev/v1/chat/completions`

Source file:

- [G:\project\kiwiLLM\llmgateway\packages\models\src\providers.ts](G:\project\kiwiLLM\llmgateway\packages\models\src\providers.ts)

## Models Updated

We did not create duplicate Qwen catalog models. These models already existed in the shared Alibaba/Qwen model list, so we added `kiwillm-qwen` as an additional provider mapping and made it the preferred provider in the local API response ordering.

### 1. `qwen3-coder-plus`

- Model ID: `qwen3-coder-plus`
- Display Name: `Qwen3 Coder Plus`
- Existing provider retained: `alibaba`
- New provider added: `kiwillm-qwen`
- Provider order in local API:
	1. `kiwillm-qwen`
	2. `alibaba`

KiwiLLM Qwen mapping:

- `providerId`: `kiwillm-qwen`
- `modelName`: `qwen3-coder-plus`
- `inputPrice`: `0`
- `outputPrice`: `0`
- `requestPrice`: `0`
- `contextSize`: `1000000`
- `maxOutput`: `66000`
- `streaming`: `true`
- `vision`: `false`
- `tools`: `true`
- `jsonOutput`: `true`
- `test`: `skip`

### 2. `qwen3-coder-flash`

- Model ID: `qwen3-coder-flash`
- Display Name: `Qwen3 Coder Flash`
- Existing provider retained: `alibaba`
- New provider added: `kiwillm-qwen`
- Provider order in local API:
	1. `kiwillm-qwen`
	2. `alibaba`

KiwiLLM Qwen mapping:

- `providerId`: `kiwillm-qwen`
- `modelName`: `qwen3-coder-flash`
- `inputPrice`: `0`
- `outputPrice`: `0`
- `requestPrice`: `0`
- `contextSize`: `262144`
- `maxOutput`: `65536`
- `streaming`: `true`
- `vision`: `false`
- `tools`: `true`
- `jsonOutput`: `true`

Source file:

- [G:\project\kiwiLLM\llmgateway\packages\models\src\models\alibaba.ts](G:\project\kiwiLLM\llmgateway\packages\models\src\models\alibaba.ts)

## API Ordering Change

The internal models API was updated so `kiwillm-qwen` is returned first for the targeted Qwen models in local API responses.

This matters because the database-backed internal models route does not otherwise guarantee provider order for a model.

Source file:

- [G:\project\kiwiLLM\llmgateway\apps\api\src\routes\internal-models.ts](G:\project\kiwiLLM\llmgateway\apps\api\src\routes\internal-models.ts)

## Gateway Runtime Support

`kiwillm-qwen` is now wired into the gateway runtime as an OpenAI-compatible upstream.

What was added:

- endpoint resolution for `kiwillm-qwen`
- header handling for `kiwillm-qwen`
- environment-based base URL support for credits/hybrid mode

Runtime behavior:

- default upstream base URL:
	- `https://qwen-worker-proxy.ronitshrimankar1.workers.dev`
- endpoint used:
	- `/v1/chat/completions`
- request auth header:
	- none required

Touched files:

- [G:\project\kiwiLLM\llmgateway\packages\actions\src\get-provider-endpoint.ts](G:\project\kiwiLLM\llmgateway\packages\actions\src\get-provider-endpoint.ts)
- [G:\project\kiwiLLM\llmgateway\packages\actions\src\get-provider-headers.ts](G:\project\kiwiLLM\llmgateway\packages\actions\src\get-provider-headers.ts)
- [G:\project\kiwiLLM\llmgateway\packages\models\src\providers.ts](G:\project\kiwiLLM\llmgateway\packages\models\src\providers.ts)

## Environment Variables

For gateway credits/hybrid mode, the provider now expects these variables:

- `LLM_KIWILLM_QWEN_API_KEY`
- `LLM_KIWILLM_QWEN_BASE_URL` (optional)

Notes:

- The worker currently accepts requests without auth headers.
- `LLM_KIWILLM_QWEN_API_KEY` still exists as the service-availability switch for environment-backed routing.
- You can set it to a placeholder value if the worker remains unauthenticated.
- If `LLM_KIWILLM_QWEN_BASE_URL` is not set, the default worker URL is used.

## Validation Status

Validated successfully:

- direct worker call to `/v1/chat/completions`
- gateway action-layer request generation for `kiwillm-qwen`
- provider key validation for `kiwillm-qwen`
- local API model/provider visibility
- local gateway process startup on `http://localhost:4001`

## Local Verification

Verified locally:

- `/internal/providers` includes `kiwillm-qwen`
- `/internal/models` shows:
	- `qwen3-coder-plus` -> `kiwillm-qwen`, `alibaba`
	- `qwen3-coder-flash` -> `kiwillm-qwen`, `alibaba`

Local services used:

- UI: `http://localhost:3002`
- API: `http://localhost:4002`
- Docs: `http://localhost:3005`

## Models Planned Next

These are the Qwen-related worker models currently in scope for the KiwiLLM-hosted rollout.

### Already integrated

- `qwen3-coder-plus`
- `qwen3-coder-flash`

### Pending review / next candidate

- `vision-model`

Notes:

- `vision-model` is currently a generic worker-exposed model id.
- It should be reviewed before adding to the shared catalog so we can decide whether:
	- to keep that exact id, or
	- to map it to a clearer canonical KiwiLLM model id

## Recommended Next Steps

1. Decide whether `vision-model` should be added as-is or renamed to a clearer canonical model id.
2. Decide whether `kiwillm-qwen` should remain a catalog-only preferred provider or be fully wired into gateway routing.
3. Add more KiwiLLM-hosted Qwen mappings once the worker exposes a stable, intentionally named model set.

## Files Changed In This Rollout

- [G:\project\kiwiLLM\llmgateway\packages\models\src\providers.ts](G:\project\kiwiLLM\llmgateway\packages\models\src\providers.ts)
- [G:\project\kiwiLLM\llmgateway\packages\models\src\models\alibaba.ts](G:\project\kiwiLLM\llmgateway\packages\models\src\models\alibaba.ts)
- [G:\project\kiwiLLM\llmgateway\apps\api\src\routes\internal-models.ts](G:\project\kiwiLLM\llmgateway\apps\api\src\routes\internal-models.ts)
