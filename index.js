/**
 * Ponytail for DeepSeek Harness — "lazy senior dev mode" as one pluggable bundle.
 *
 * Upstream: https://github.com/DietrichGebert/ponytail (MIT). The skill bodies in
 * `assets/skills/` are upstream content (`ponytail` and `ponytail-help` adapted to
 * this host); provenance is recorded in UPSTREAM.md.
 *
 * Turning the bundle on is the only control a user needs. Three Harness seams,
 * no slash command and no state file:
 *
 * - `ctx.systemPrompt.section()`    the always-on rules; the text provider runs on
 *                                   every step assembly, so the configured level
 *                                   applies with no notification or gesture
 * - `ctx.skills.registerProvider()` the six skills (`/ponytail-review`, …)
 * - `agent/inbox/inserted`          a whole-message "stop ponytail" / "normal mode"
 *                                   ends the rules for this process run
 *
 * The level is deployment configuration: `PONYTAIL_DEFAULT_MODE` (upstream's
 * environment override), else the row's `defaultMode`, else `full`.
 *
 * Node builtins only: a profile-installed bundle cannot resolve `@deepseek-ai/*`
 * modules at runtime, so the branded ids and ranks upstream imports are inlined.
 *
 * shortcut: the level is process-wide, not per project; upgrade by registering the
 * section on each `agent.ctx` keyed by the session working directory.
 *
 * @module @dsh-ext/dsh-ponytail
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** Cordis plugin name. */
export const name = "ponytail";
/** Services this bundle cannot work without. */
export const inject = ["skills", "systemPrompt"];

/** Provider label every candidate must carry. */
const PROVIDER = "ponytail";
/** Precedence of DSH's own packaged skill providers (`BUNDLED_SKILL_RANK`). */
const BUNDLED_RANK = 600;
/** Free gap between first-party guidance (9000) and structured output (9900). */
const SECTION_NAME = "ponytail:rules";
const SECTION_ORDER = 9500;
/** Levels the configured `defaultMode` accepts. */
const RUNTIME_MODES = ["off", "lite", "full", "ultra"];
const FALLBACK_MODE = "full";
const SKILL_NAMES = [
	"ponytail",
	"ponytail-review",
	"ponytail-audit",
	"ponytail-debt",
	"ponytail-gain",
	"ponytail-help",
];
/** The core rules ship in the prompt; only the five task skills take a gesture. */
const MODEL_ONLY = new Set(["ponytail"]);
/** Whole-message deactivation phrases, matched exactly as upstream matches them. */
const DEACTIVATION_PHRASES = new Set(["stop ponytail", "normal mode"]);
const ASSETS_DIR = fileURLToPath(new URL("assets/", import.meta.url));

/**
 * Normalize one runtime level; anything else is not a level.
 * @param value - candidate level text.
 * @returns the lowercase level, or `undefined`.
 */
export function normalizeMode(value) {
	if (typeof value !== "string") return void 0;
	const normalized = value.trim().toLowerCase();
	return RUNTIME_MODES.includes(normalized) ? normalized : void 0;
}

/**
 * Split one SKILL.md into its frontmatter fields and its instruction body. Only
 * the shape the bundled assets use is understood: `key: value` and folded
 * (`key: >`) scalars whose continuation lines are indented.
 * @param raw - complete SKILL.md text.
 * @returns metadata fields plus the trimmed body without frontmatter.
 */
export function parseSkillFile(raw) {
	const lines = String(raw ?? "").split(/\r?\n/);
	if (lines[0]?.trim() !== "---") return { meta: {}, body: String(raw ?? "").trim() };
	const meta = {};
	let key;
	let index = 1;
	for (; index < lines.length; index += 1) {
		const line = lines[index];
		if (line.trim() === "---") {
			index += 1;
			break;
		}
		const field = /^([A-Za-z0-9_-]+):[ \t]*(.*)$/.exec(line);
		if (field !== null) {
			key = field[1];
			const value = field[2].trim();
			meta[key] = value === ">" || value === "|" ? "" : value.replace(/^["']|["']$/g, "");
		} else if (key !== void 0 && /^\s+\S/.test(line)) {
			meta[key] = meta[key] === "" ? line.trim() : `${meta[key]} ${line.trim()}`;
		}
	}
	return { meta, body: lines.slice(index).join("\n").trim() };
}

/**
 * Keep only the active level's rows and worked examples, exactly as upstream's
 * `filterSkillBodyForMode` does: a table row or bullet whose label is a level
 * belongs to that level alone, and every other line survives verbatim.
 * @param body - instruction body without frontmatter.
 * @param mode - active runtime level.
 * @returns the body filtered to that level.
 */
export function filterBodyForMode(body, mode) {
	return String(body ?? "")
		.split(/\r?\n/)
		.filter((line) => {
			const tableRow = /^\|\s*\*\*(.+?)\*\*\s*\|/.exec(line);
			if (tableRow !== null) {
				const label = normalizeMode(tableRow[1]);
				if (label !== void 0) return label === mode;
			}
			const example = /^-\s*([^:]+):\s*"/.exec(line);
			if (example !== null) {
				const label = normalizeMode(example[1]);
				if (label !== void 0) return label === mode;
			}
			return true;
		})
		.join("\n");
}

/**
 * Whether one whole inbox message is a deactivation phrase.
 * @param message - user message that entered an inbox.
 * @returns whether the rules should stop for this process run.
 */
export function isDeactivationMessage(message) {
	const content = message?.content;
	if (!Array.isArray(content)) return false;
	const text = content
		.filter((block) => block?.type === "text" && typeof block.text === "string")
		.map((block) => block.text)
		.join(" ")
		.trim()
		.toLowerCase()
		.replace(/[.!?\s]+$/, "");
	return DEACTIVATION_PHRASES.has(text);
}

/**
 * Read every bundled skill once, at activation.
 * @param ctx - plugin context, for warnings about unreadable assets.
 * @returns parsed skills keyed by name, in catalog order.
 */
function loadSkills(ctx) {
	const skills = new Map();
	for (const skillName of SKILL_NAMES) {
		const path = join(ASSETS_DIR, "skills", skillName, "SKILL.md");
		try {
			const { meta, body } = parseSkillFile(readFileSync(path, "utf8"));
			const description = typeof meta.description === "string" ? meta.description.trim() : "";
			if (meta.name !== skillName || description === "" || body === "") {
				ctx.logger?.warn(`ponytail skill ${skillName} ignored: asset needs name, description and a body`);
				continue;
			}
			skills.set(skillName, {
				name: skillName,
				description,
				...(typeof meta.whenToUse === "string" && meta.whenToUse !== "" ? { whenToUse: meta.whenToUse } : {}),
				invocation: {
					modelInvocable: meta["disable-model-invocation"] !== "true",
					userInvocable: !MODEL_ONLY.has(skillName) && meta["user-invocable"] !== "false",
				},
				provider: PROVIDER,
				source: "bundled",
				rank: BUNDLED_RANK,
				path,
				resourceBase: { kind: "directory", path: ASSETS_DIR },
				body,
			});
		} catch (error) {
			ctx.logger?.warn(`ponytail skill ${skillName} unavailable: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	return skills;
}

/**
 * Render the always-on rules for one level.
 * @param mode - configured level.
 * @param skills - parsed skills.
 * @returns the injected text, empty when off.
 */
function renderRules(mode, skills) {
	if (mode === "off") return "";
	const skill = skills.get("ponytail");
	// shortcut: inline prose stands in for a missing canonical skill; upgrade if
	// the asset set ever ships without skills/ponytail/SKILL.md.
	const body = skill?.body ?? "You are a lazy senior developer. The best code is the code never written.";
	return `PONYTAIL MODE ACTIVE — level: ${mode}\n\n${filterBodyForMode(body, mode)}`;
}

/** Register the bundle's three Harness contributions. */
export function apply(ctx, config = {}) {
	const skills = loadSkills(ctx);
	const configured = normalizeMode(config.defaultMode);
	if (config.defaultMode !== void 0 && configured === void 0) {
		ctx.logger?.warn(`ponytail config defaultMode "${String(config.defaultMode)}" ignored; expected one of ${RUNTIME_MODES.join(", ")}`);
	}
	// In-memory only: this bundle writes no state file, so a restart or a bundle
	// toggle restores the configured level.
	const state = { mode: normalizeMode(process.env.PONYTAIL_DEFAULT_MODE) ?? configured ?? FALLBACK_MODE };

	ctx.systemPrompt.section({
		name: SECTION_NAME,
		order: SECTION_ORDER,
		interpolate: false,
		text: () => renderRules(state.mode, skills),
	});

	const candidates = [...skills.values()].map(({ body: _body, ...candidate }) => ({ ...candidate, locator: candidate.name }));
	const definitions = new Map([...skills.values()].map(({ body, ...definition }) => [definition.name, { ...definition, content: body }]));
	ctx.skills.registerProvider(() => ({
		name: PROVIDER,
		list: () => Promise.resolve(candidates),
		get: (candidate) => Promise.resolve(definitions.get(candidate?.locator ?? candidate?.name)),
	}));

	ctx.on("agent/inbox/inserted", ({ message }) => {
		if (state.mode !== "off" && isDeactivationMessage(message)) state.mode = "off";
	});
}
