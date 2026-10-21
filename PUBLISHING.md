# Publishing and discovery

The repository is public at
<https://github.com/Vincent-chk/dsh-ponytail>. Two things make it discoverable:
the GitHub `dsh-plugin` topic (auto-collected by the deepseek1024 catalog) and
the format-1 market index in `market/` (for DSH's Discover tab). npm publishing
is optional and needs an npm account.

## Already done by the repository

- `package.json` declares `dsh.bundle.patch` and is public (`private` removed),
  with `engines.dsh`, keywords, repository and homepage.
- The repository carries the GitHub topics `dsh-plugin`, `deepseek-harness`,
  `dsh`, `ponytail`, `skill`, so the deepseek1024 catalog discovers it on its
  next crawl (it validates `package.json`, `dsh.bundle.patch` and the patch file
  in the default branch tree, read-only).
- `market/index.json` is a format-1 index that pins one exact Git commit, so
  anyone can add
  `https://vincent-chk.github.io/dsh-ponytail/market/index.json`
  as an index source and install from Discover.

## Release a new version

1. Bump `version` in `package.json` (SemVer) and update `CHANGELOG` if you keep one.
2. Commit, then `git tag v<version>` and `git push --tags`.
3. Point `market/index.json` at the new release commit:
   - `versions[].version`: the version you bumped to
   - `versions[].publishTimestamp`: `date +%s`
   - `versions[].source.commit`: `git rev-parse v<version>^{commit}`
   - keep older entries so users can install them
4. Commit and push; GitHub Pages republishes within a minute, and DSH caches an
   index for 10 minutes.

## Publish to npm (optional, needs your npm account)

The current package name uses the local `@dsh-ext` scope, which is not an npm
scope you own. To publish:

1. Rename `name` to a scope you own or an unregistered bare name, for example
   `@vincent-chk/dsh-ponytail`. The bare name `dsh-ponytail` is already taken on
   npm. Update the row `name` in `cordis.patch.yml` to the same value.
2. `npm login`, then `npm publish --access public`.
3. Add an npm-sourced version entry to `market/index.json`:

   ```json
   "source": { "type": "npm" }
   ```

4. Registry-based community indexes then pick the package up automatically:
   REALOIYO's index searches npm for `keywords:dsh-plugin` packages that declare
   `dsh.bundle` (every 6 hours). The Open Plugin Market accepts a submission at
   <https://github.com/polang233/dsh-plugin-index/issues/new?template=plugin.yml>
   (public source, installable npm version, clear license; a fixed Git commit is
   possible with maintainer confirmation).

## Verify after a release

```bash
gh api repos/Vincent-chk/dsh-ponytail --jq '.visibility'
gh api repos/Vincent-chk/dsh-ponytail/topics --jq '.names'
curl -s https://vincent-chk.github.io/dsh-ponytail/market/index.json | head -c 200
npm test
```
