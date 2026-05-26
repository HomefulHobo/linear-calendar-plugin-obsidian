# Release Checklist for AI Assistant

When the user asks to prepare a new version release, complete these tasks:

## Required Steps

- [ ] Update version in `manifest.json`
- [ ] Update version in `package.json`
- [ ] Add new version to `versions.json` mapped to the current `minAppVersion` (e.g. `"0.6.0": "1.5.0"`). Only one entry per minAppVersion threshold is needed — if you raise `minAppVersion` in a release, also keep the previous version mapped to the old value so users on older Obsidian installs are served the last compatible build.
- [ ] Update `CHANGELOG.md` with changes for this version as noted in `CHANGELOG_NEXT.md`
- [ ] Update `AI_CONTEXT.md` with any new features or architectural changes
- [ ] Run `npm run build` to verify the build succeeds
