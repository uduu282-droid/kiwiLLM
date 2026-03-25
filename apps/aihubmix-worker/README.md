# AIHubMix Worker

Cloudflare Worker that proxies OpenAI-compatible requests to AIHubMix.

## Endpoints

- `GET /health`
- `GET /v1/models`
- `POST /v1/chat/completions`

## Setup

```bash
pnpm install
pnpm --dir apps/aihubmix-worker wrangler secret put AIHUBMIX_API_KEY
pnpm --dir apps/aihubmix-worker wrangler deploy
```