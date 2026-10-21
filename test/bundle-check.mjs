/**
 * Integration self-check: runs the real `apply()` against a fake Cordis context
 * in a throwaway DSH_HOME and asserts the bundle's whole contract — configured
 * level, no command, no state file, deactivation listener, skill provider.
 * Run: `node test/bundle-check.mjs`.
 */
import assert from "node:assert/strict";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.DSH_HOME = mkdtempSync(join(tmpdir(), "ponytail-check-"));
delete process.env.PONYTAIL_DEFAULT_MODE;
const { apply } = await import("../index.js");

const log = [];
/** One fake Cordis context that records what the plugin registers. */
function makeCtx() {
	const ctx = {
		logger: { warn: (message) => log.push(message), info: () => {}, error: (message) => log.push(message) },
		sections: [],
		providers: [],
		listeners: new Map(),
		commandRegistrations: 0,
		injectCalls: 0,
		systemPrompt: {
			section(section) {
				ctx.sections.push(section);
				return () => {};
			},
		},
		skills: {
			registerProvider(create) {
				ctx.providers.push(create({ signal: new AbortController().signal, invalidate: () => {} }));
				return () => {};
			},
		},
		on(name, listener) {
			ctx.listeners.set(name, listener);
			return () => {};
		},
		inject() {
			ctx.injectCalls += 1;
		},
		commands: {
			register() {
				ctx.commandRegistrations += 1;
				return () => {};
			},
		},
	};
	return ctx;
}

/** Activate one fresh fake context and return it with its section. */
function activate(config) {
	const ctx = makeCtx();
	apply(ctx, config);
	assert.equal(ctx.sections.length, 1, "exactly one prompt section");
	assert.equal(ctx.sections[0].name, "ponytail:rules");
	assert.equal(ctx.sections[0].interpolate, false);
	return ctx;
}

const full = activate({ defaultMode: "full" });
const fullText = full.sections[0].text();
assert.match(fullText, /^PONYTAIL MODE ACTIVE — level: full\n\n# Ponytail/);
assert.match(fullText, /no command is needed/, "the rules name the config setting, not a command");
assert.ok(!/\/ponytail lite\|full\|ultra/.test(fullText), "no switch command is promised");
assert.match(fullText, /^\|\s*\*\*full\*\*\s*\|/m, "only the configured level row survives");

assert.equal(full.commandRegistrations, 0, "the bundle registers no command");
assert.equal(full.injectCalls, 0, "the bundle injects no optional service");
assert.ok(!existsSync(join(process.env.DSH_HOME, "ponytail")), "no state file or directory is written");

const lite = activate({ defaultMode: "lite" });
const liteText = lite.sections[0].text();
assert.match(liteText, /level: lite/);
assert.match(liteText, /^\|\s*\*\*lite\*\*\s*\|/m);
assert.ok(!liteText.includes("**ultra**"));

assert.equal(activate({ defaultMode: "off" }).sections[0].text(), "", "off injects nothing");
assert.match(activate({ defaultMode: " Ultra " }).sections[0].text(), /level: ultra/);

log.length = 0;
const fallback = activate({ defaultMode: "banana" });
assert.match(fallback.sections[0].text(), /level: full/, "an invalid defaultMode falls back to full");
assert.equal(log.length, 1, "and warns once");

process.env.PONYTAIL_DEFAULT_MODE = "ultra";
assert.match(activate({ defaultMode: "lite" }).sections[0].text(), /level: ultra/, "the environment override wins");
delete process.env.PONYTAIL_DEFAULT_MODE;

const stopped = activate({ defaultMode: "full" });
stopped.listeners.get("agent/inbox/inserted")({ message: { role: "user", content: [{ type: "text", text: "Stop Ponytail." }] } });
assert.equal(stopped.sections[0].text(), "", "a whole-message deactivation phrase empties the section");
const unrelated = activate({ defaultMode: "full" });
unrelated.listeners.get("agent/inbox/inserted")({ message: { role: "user", content: [{ type: "text", text: "add a normal mode toggle" }] } });
assert.match(unrelated.sections[0].text(), /level: full/, "ordinary prose is not a deactivation command");

const provider = full.providers[0];
assert.equal(provider.name, "ponytail");
const candidates = await provider.list();
assert.equal(candidates.length, 6, "six bundled skills");
for (const candidate of candidates) {
	assert.equal(candidate.provider, "ponytail");
	assert.equal(candidate.rank, 600);
	assert.equal(typeof candidate.path, "string");
}
assert.deepEqual(candidates.find((c) => c.name === "ponytail").invocation, { modelInvocable: true, userInvocable: false });
assert.deepEqual(candidates.find((c) => c.name === "ponytail-review").invocation, { modelInvocable: true, userInvocable: true });
const loaded = await provider.get(candidates.find((c) => c.name === "ponytail-review"));
for (const field of ["name", "description", "invocation", "source", "provider", "content"]) {
	assert.ok(loaded[field] !== void 0, `definition carries ${field}`);
}
assert.equal(loaded.name, "ponytail-review");
assert.match(loaded.content, /Review a change like the senior developer/);
assert.ok(!loaded.content.startsWith("---"), "loaded bodies carry no frontmatter");

assert.deepEqual(log.filter((message) => !message.includes("banana")), [], "no unexpected warnings");
console.log("bundle-check: all assertions passed");
