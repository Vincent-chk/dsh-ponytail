# Ponytail for DeepSeek Harness

English | [中文](README.zh.md)

[Ponytail](https://github.com/DietrichGebert/ponytail) is "lazy senior dev
mode": the smallest change that fully solves the task, and a reply a busy human
understands in one read. This bundle ports it to DeepSeek Harness as one
pluggable unit — switch it on and it applies to every session. There is no slash
command to remember.

## What you get (bundle on = on)

- **Always-on rules.** A prompt section (`ponytail:rules`, order 9500) carries
  `PONYTAIL MODE ACTIVE — level: <level>` plus the canonical rules, re-read at
  every step assembly, for every session in this profile, subagents included.
- **Six skills.** The session catalog tells the model to load a skill when a
  request matches, so "review this change" reaches `ponytail-review` without any
  gesture. The five task skills can also be typed as `/ponytail-review`,
  `/ponytail-audit`, `/ponytail-debt`, `/ponytail-gain`, `/ponytail-help`; the
  core `ponytail` skill stays model-only.
- **A configured level.** `defaultMode` in the row config: `off`, `lite`,
  `full` (default) or `ultra`. No command and no state file: turn the bundle on
  and the configured level is what runs.
- **Deactivation phrases.** A whole message that is exactly "stop ponytail" or
  "normal mode" ends the rules for this process run, as upstream does; a bundle
  toggle or restart restores the configured level.

## Levels

| `defaultMode` | Behavior |
|---|---|
| `off` | No rules injected; the six skills still load on demand. |
| `lite` | Build what was asked; name the smaller option in one line. |
| `full` | The rules above. Default. |
| `ultra` | Also question the request before building. |

## Install

Pick any route; all of them install the same bundle (a package with a
`dsh.bundle.patch`).

| Route | Spec to give **Plugins → Add plugin** (or `dsh plugin add`) |
|---|---|
| GitHub | `github:Vincent-chk/dsh-ponytail` |
| Git URL | `https://github.com/Vincent-chk/dsh-ponytail` |
| Tarball | `npm pack` in a checkout, then the absolute path to the `.tgz` |
| Local checkout | the absolute path of this directory |

**From the plugin market:** add this index source in
**Plugins → Discover → Add index source** and install from the card:

```
https://vincent-chk.github.io/dsh-ponytail/market/index.json
```

`npm publish` is prepared in [PUBLISHING.md](PUBLISHING.md); the package is not
on npm yet.

Toggling the bundle off in the Plugins page removes the rules and all six
skills; toggling it back on restores them.

## Change the level

Add an override row to the profile's `cordis.patch.yml` — the loader replaces
the row's complete `config`, so restate the level you want:

```yaml
- id: ponytail
  name: '@dsh-ext/dsh-ponytail'
  config:
    defaultMode: lite   # off | lite | full | ultra
```

HMR recomposes on the patch change; if it does not, toggle the bundle off and on
in the Plugins page. `PONYTAIL_DEFAULT_MODE` overrides the row config. Resolution
order: `PONYTAIL_DEFAULT_MODE` > row `defaultMode` > `full`.

## Not ported, on purpose

- The Claude Code statusline/band and the local HTML board: DeepSeek Harness
  already shows token and cache usage, and the band is a Claude-private API.
- The `/ponytail` level command and its state file: the bundle switch is the
  control, and the level is deployment configuration. The upstream sentence in
  the rules was adapted to say so.
- Per-project levels: the level is process-wide. `shortcut:` the upgrade path is
  registering the section per `agent.ctx` keyed by session cwd.
- `/ponytail default <mode>`: the default is row config, not a command.

## Verify

`npm test` runs two checks: `test/selfcheck.mjs` asserts the level grammar,
frontmatter parsing, level filtering, deactivation matching, and that all six
bundled assets are complete; `test/bundle-check.mjs` runs the real `apply()`
against a fake Cordis context and asserts the injected rules follow the
configured level, no command is registered, no state file is written, the
deactivation listener empties the section, and the skill provider serves all six
skills with registry-valid definitions.

On macOS volumes that store extended attributes as AppleDouble files (exFAT,
some network mounts), a write beside `locale/*.json` can leave a `._*.json`
companion that the Harness locale reader rejects as a language file;
`npm run clean:macos` removes them, and the self-check fails until it does.

## License

MIT; see [UPSTREAM.md](UPSTREAM.md) for provenance. Skill bodies are upstream
content (`ponytail` and `ponytail-help` adapted for this host).
