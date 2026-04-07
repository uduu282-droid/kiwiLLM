import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const playgroundRoot = resolve(__dirname, "..");
const nextRoot = resolve(playgroundRoot, ".next");
const standaloneRoot = resolve(nextRoot, "standalone", "apps", "playground");
const standaloneNextRoot = resolve(standaloneRoot, ".next");

if (existsSync(resolve(nextRoot, "static"))) {
	mkdirSync(standaloneNextRoot, { recursive: true });
	cpSync(resolve(nextRoot, "static"), resolve(standaloneNextRoot, "static"), {
		force: true,
		recursive: true,
	});
}

if (existsSync(resolve(playgroundRoot, "public"))) {
	mkdirSync(standaloneRoot, { recursive: true });
	cpSync(resolve(playgroundRoot, "public"), resolve(standaloneRoot, "public"), {
		force: true,
		recursive: true,
	});
}
