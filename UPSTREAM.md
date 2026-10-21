# Upstream provenance

This bundle is a derivative of [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail),
MIT licensed. Content was fetched on 2026-10-21 from the pinned commit below;
`LICENSE.upstream` is the upstream license verbatim.

| Item | Source | Treatment here |
|---|---|---|
| `skills/ponytail/SKILL.md` | commit `09c434ab73ca43761c5d8b0c5d341926c2fba710` (v5.3.2) | **adapted**: the one sentence that promised a `/ponytail` switch command now names the `defaultMode` setting; the rest is verbatim |
| `skills/ponytail-review/SKILL.md` | same | verbatim |
| `skills/ponytail-audit/SKILL.md` | same | verbatim |
| `skills/ponytail-debt/SKILL.md` | same | verbatim |
| `skills/ponytail-gain/SKILL.md` | same | verbatim |
| `skills/ponytail-help/SKILL.md` | same | **adapted**: host-specific sections (Codex/Claude/OpenCode triggers, Claude band, `/plugin` marketplace updates) replaced with their DeepSeek Harness equivalents |
| `benchmarks/results/2026-10-07-agentic.md` | same | verbatim, so `/ponytail-gain`'s citation resolves inside the bundle |
| `hooks/ponytail-instructions.js` (`filterSkillBodyForMode`) | same | logic ported into `index.js` as `filterBodyForMode` |
| `hooks/ponytail-config.js` (mode grammar, deactivation phrases) | same | logic ported into `index.js` (`normalizeMode`, `isDeactivationMessage`, `PONYTAIL_DEFAULT_MODE`); neither the XDG config file nor a level state file is read: the level is the plugin row's `defaultMode` |
| `AGENTS.md` | same | not shipped: the injected rules come from `skills/ponytail/SKILL.md`, which is the canonical text |
| `commands/*.toml`, the `/ponytail` level command and its state file | same | not shipped: switching the bundle on is the only user control, and the level is deployment configuration (`defaultMode`); the in-session deactivation phrases remain |
| `hooks/*.js`, `hooks/band/*`, 30+ host manifests | same | not ported: Claude/Cursor/Copilot subprocess hooks and the Claude-only band have no equivalent here; DeepSeek Harness injects the rules through a prompt section instead |

To refresh the content, replace the files under `assets/` with the upstream
versions at a newer commit and update this table.
