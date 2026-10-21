/**
 * Assert-based self-check for the pure logic in ../index.js and for the bundled
 * skill assets. Run: `node test/selfcheck.mjs` from the bundle directory.
 */
import assert from "node:assert/strict";
import { globSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
	filterBodyForMode,
	isDeactivationMessage,
	normalizeMode,
	parseSkillFile,
} from "../index.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const assets = fileURLToPath(new URL("../assets/skills/", import.meta.url));
const names = ["ponytail", "ponytail-review", "ponytail-audit", "ponytail-debt", "ponytail-gain", "ponytail-help"];
let checks = 0;
function check(label, fn) {
	fn();
	checks += 1;
	console.log(`ok  ${label}`);
}

check("normalizeMode accepts the four runtime levels only", () => {
	assert.equal(normalizeMode(" Ultra "), "ultra");
	assert.equal(normalizeMode("OFF"), "off");
	assert.equal(normalizeMode("review"), undefined);
	assert.equal(normalizeMode(7), undefined);
});

check("parseSkillFile splits frontmatter from body", () => {
	const { meta, body } = parseSkillFile(readFileSync(`${assets}ponytail/SKILL.md`, "utf8"));
	assert.equal(meta.name, "ponytail");
	assert.equal(meta["argument-hint"], "[lite|full|ultra|off]");
	assert.match(meta.description, /^Lazy senior dev mode: the smallest change/);
	assert.ok(!meta.description.includes("\n"), "folded description collapses to one line");
	assert.match(body, /^# Ponytail\n/);
	assert.ok(!body.startsWith("---"), "body carries no frontmatter");
});

check("parseSkillFile tolerates a file without frontmatter", () => {
	const parsed = parseSkillFile("# Plain\n\ntext\n");
	assert.deepEqual(parsed.meta, {});
	assert.equal(parsed.body, "# Plain\n\ntext");
});

check("filterBodyForMode keeps only the active level", () => {
	const { body } = parseSkillFile(readFileSync(`${assets}ponytail/SKILL.md`, "utf8"));
	const lite = filterBodyForMode(body, "lite");
	const ultra = filterBodyForMode(body, "ultra");
	assert.match(lite, /^\|\s*\*\*lite\*\*\s*\|/m);
	assert.ok(!lite.includes("**ultra**"), "lite drops the ultra row");
	assert.match(ultra, /^\|\s*\*\*ultra\*\*\s*\|/m);
	assert.ok(!ultra.includes("**lite**"), "ultra drops the lite row");
	// Rules that merely start with a level word are prose and must survive.
	assert.match(lite, /Never cut: validation at trust boundaries/);
	assert.equal(filterBodyForMode(body, "full").split("\n").length >= lite.split("\n").length, true);
});

check("isDeactivationMessage matches whole messages only", () => {
	const message = (text) => ({ role: "user", content: [{ type: "text", text }] });
	assert.equal(isDeactivationMessage(message("Stop Ponytail.")), true);
	assert.equal(isDeactivationMessage(message("normal mode")), true);
	assert.equal(isDeactivationMessage(message("please add a normal mode toggle")), false);
	assert.equal(isDeactivationMessage(message("keep going")), false);
	assert.equal(isDeactivationMessage({ role: "user", content: [{ type: "image" }] }), false);
	assert.equal(isDeactivationMessage(undefined), false);
});

check("every bundled skill asset is loadable and complete", () => {
	for (const skill of names) {
		const { meta, body } = parseSkillFile(readFileSync(`${assets}${skill}/SKILL.md`, "utf8"));
		assert.equal(meta.name, skill, `${skill}: frontmatter name`);
		assert.ok(meta.description.length > 20, `${skill}: description`);
		assert.ok(body.length > 200, `${skill}: body`);
	}
});

check("no macOS AppleDouble companions and only language-id locale files", () => {
	// exFAT volumes create "._name" beside every file; the Harness locale reader
	// rejects them as language files, so a stray companion breaks the bundle card.
	assert.deepEqual(globSync("**/._*", { cwd: root }), [], "run `npm run clean:macos` to remove AppleDouble companions");
	const locales = globSync("locale/*.json", { cwd: root });
	assert.ok(locales.length >= 2, "locale dictionaries exist");
	for (const file of locales) {
		const language = file.slice("locale/".length, -".json".length);
		assert.match(language, /^[a-z]{2,8}(?:-[a-z0-9]{1,8})*$/, `${file} must be named after a language id`);
	}
});

console.log(`\n${checks} checks passed`);
