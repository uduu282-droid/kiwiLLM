import type { Variables } from "./auth/types.js";
import type { Env } from "hono/types";

export interface ServerTypes extends Env {
	Variables: Variables;
}
