# Changelog — Next Release Draft

Add entries here during development. When releasing, move contents into CHANGELOG.md under the new version heading and delete this file's content.

---

### Added
- **Banner registry** (`src/banners.ts`): All banner definitions (content, visibility logic, settings keys) now live in one file. Adding a new banner only requires a new entry here — no changes needed in rendering or settings code.
- **Community Plugin migration banner**: Shown automatically to users who installed via BRAT, prompting them to switch to the Community Plugins install method. Auto-hides once the plugin is removed from BRAT. The "Show again" option in settings is hidden for users who have already migrated.

### Changed
- **Banner dismissed-state** moved from per-feature `hasSeenWelcomeBanner` flags into a unified `settings.banners` object. Existing dismissed state is migrated automatically on first load — no banners will reappear for existing users.
