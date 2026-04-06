import { OpenAPIHono } from "@hono/zod-openapi";

import { audio } from "./audio.js";

import type { ServerTypes } from "@/vars.js";

export const audioRoute = new OpenAPIHono<ServerTypes>();

audioRoute.route("/", audio);
