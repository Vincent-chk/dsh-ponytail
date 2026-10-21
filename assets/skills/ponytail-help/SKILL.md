---
name: ponytail-help
description: >
  Quick reference for ponytail levels, skills and commands in DeepSeek Harness.
  One-shot display. Use for /ponytail-help, "ponytail help", "how do I use
  ponytail".
---

# Ponytail Help (DeepSeek Harness)

Display this reference card when invoked. One-shot, do NOT change mode,
write state files, or persist anything.

## Levels

| Level | `defaultMode` | What changes |
|-------|---------------|--------------|
| **Lite** | `lite` | Build what was asked, name the smaller option in one line. |
| **Full** | `full` | The smallest complete change, a check where the logic needs one, and a reply that names what was skipped and any risk. Default. |
| **Ultra** | `ultra` | Also questions the request and pushes back before building. |
| **Off** | `off` | No rules injected; the skills below still load on demand. |

The level is process-wide (every session in this DeepSeek Harness profile) and
is read when the bundle loads, so switching it needs no command.

## Skills

| Skill | Trigger | What it does |
|-------|---------|--------------|
| **ponytail** | loaded by the model, or by the always-on rules | Lazy mode itself: least new code, clear replies that name skipped work and risks. |
| **ponytail-review** | `/ponytail-review` | Quality review of a change: bugs, security, load, missing tests, speed, what to cut. Each finding says what goes wrong and how to fix it. |
| **ponytail-audit** | `/ponytail-audit` | The same quality review for the whole repo, ranked. |
| **ponytail-debt** | `/ponytail-debt` | Harvest `shortcut:` comments into a tracked ledger. |
| **ponytail-gain** | `/ponytail-gain` | Measured-impact scoreboard: less code, less cost, more speed. |
| **ponytail-help** | `/ponytail-help` | This card. |

The five task skills are user-invocable: type `/` in the composer and pick one,
or type the name directly. `ponytail` itself is model-invocable only, because
`/ponytail` is the level command.

## Deactivate

Say "stop ponytail" or "normal mode" as a whole message: the rules stop for
this run (a restart or a bundle toggle restores the configured level). Turning
the bundle off in the Plugins page removes the rules and all six skills at once.

## Configure the default level

Row config in the profile's `cordis.patch.yml` (applies when no level is stored yet):

```yaml
- id: ponytail
  name: '@dsh-ext/dsh-ponytail'
  config:
    defaultMode: lite   # off | lite | full | ultra
```

Environment variable, highest priority:

```bash
export PONYTAIL_DEFAULT_MODE=ultra
```

Resolution: `PONYTAIL_DEFAULT_MODE` > row `defaultMode` > `full`. Reading it
again means restarting the bundle (off/on in the Plugins page).

## Update and remove

DeepSeek Harness → Plugins → Ponytail: toggle, update, or remove. An agent can
do the same with its `plugin_manager` tool. There is no state file to keep.

## Not ported from upstream

The Claude Code statusline/band and the local HTML board are not part of this
bundle; DeepSeek Harness already shows token and cache usage in the composer.

## More

Full docs, rules and benchmarks: https://github.com/DietrichGebert/ponytail
