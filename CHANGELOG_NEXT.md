# Changelog — Next Release Draft

Add entries here during development. When releasing, move contents into CHANGELOG.md under the new version heading and delete this file's content.

---

### Added
- **Banner registry** (`src/banners.ts`): All banner definitions (content, visibility logic, settings keys) now live in one file. Adding a new banner only requires a new entry here — no changes needed in rendering or settings code.
- **Community Plugin migration banner**: Shown automatically to users who installed via BRAT, prompting them to switch to the Community Plugins install method. Auto-hides once the plugin is removed from BRAT. The "Show again" option in settings is hidden for users who have already migrated.
- **Periodic notes section README**: Included periodic notes feature in the README file.
- **Periodic Notes sub-folder recognition**: Weekly, monthly, quarterly, yearly, and custom period notes are now recognized across sub-folders of the configured folder. An "Include sub-folders" checkbox appears directly under each note type's folder setting (checked by default). When the Periodic Notes plugin is active for a type, sub-folders are always searched automatically.
- **Hide second date portion (multi-day notes)**: New setting nested under "Hide date portion in titles" — when enabled, also strips the second date and the connector between them (e.g., "to" or "–") from multi-day note titles, showing only the trailing text. The child setting is only visible when the parent toggle is on.

### Changed
- **Banner dismissed-state** moved from per-feature `hasSeenWelcomeBanner` flags into a unified `settings.banners` object. Existing dismissed state is migrated automatically on first load — no banners will reappear for existing users.
- **Feedback banner settings updated** to display my current questions for feedback.
