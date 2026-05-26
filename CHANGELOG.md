# Changelog

All notable changes to the Linear Calendar plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.5.0] - 2026-05-26

### Added
- **Settings button in calendar header** — a gear icon button now appears to the right of the Add Note button. Clicking it opens the LinearCalendar settings tab directly. This improves navigation speed.
- **Category visibility toggle (hide/show)** — each category chip in the calendar's index row now has an eye icon. Clicking it hides or shows all notes belonging to that category. Hidden categories' chips appear dimmed.
- **Confirmation dialogs for destructive category actions** — disabling or deleting a category now shows a confirmation prompt, preventing accidental changes.
- **Instant tooltips on category action buttons** — all icon buttons in the category settings list and edit modal show their label immediately on hover, with no browser delay, using a CSS-based tooltip.
#### Recurring Events
- **Recurring Events** — notes can now appear on the calendar on a recurring schedule (yearly, monthly, or weekly) without creating extra files. Register a property name in the new **Recurring Events** settings tab, then add that property to any note with a date value.
- Two supported formats:
  - **Full ISO date** (`1980-03-14`) — recommended for birthdays and anniversaries; the plugin tracks the start year for age counting. Repeat rhythm (yearly / monthly / weekly) is set per rule
  - **RRULE pattern** — for complex schedules like "2nd Tuesday of every month" or "last Sunday". An optional start-date and/or end-date property can be set. _This format is what other calendar apps use._
- **Display Title** configurable per rule: `note title` only, `title + property name`, or `title + property name + years elapsed` (e.g. "Lila – Birthday (2)")
- **Custom Separator** between title and property name can be set or left empty for none.
- **Hover tooltip** on recurring calendar entries shows the full formatted label, not the raw filename
- **RRULE builder modal** — a UI to generate RRULE strings (Yearly / Monthly / Nth weekday / last weekday / Weekly) with a live plain-language preview.
    - Accessible via the command palette ("Edit recurring rule for current note"), by right-clicking a recurring note in the calendar or by clicking the edit icon in a note's property.
- **Live preview property display** — RRULE properties in the note's Properties pane show their human-readable description (e.g. "Every year in March on the 14th") alongside an inline pencil icon that opens the RRULE builder. The raw RRULE string is only visible in source mode.
- **Inline editor widget** — a pencil icon appears next to registered RRULE properties in the note's source-mode editor, opening the RRULE builder directly
- **Date extraction hint** — the Basic Settings tab points to the Recurring Events tab for date extraction tied to recurring notes
- **Birthday rule pre-configured** — new users see a ready-to-use "birthday" rule (full ISO date, yearly, title + years elapsed) so the feature is immediately understandable

### Improved
- **Category disable/enable UX** — the enabled checkbox in the category list and edit modal has been replaced with a dedicated ban-icon button. When a category is disabled, the ban icon turns red and the entire category row fades out, making its inactive state immediately visible. The button is consistently labelled "Disable" / "Enable" throughout settings and the modal.
- **Category edit modal footer** — the Delete and Disable buttons are now left-aligned, with Close on the right, making the layout clearer and reducing the chance of accidental deletion.
- **Delete button in category settings list** — the × button has been replaced with a trash icon, matching the modal and making its purpose unambiguous.
- **"Your Categories" description** — the text above the categories list has been rewritten to clearly explain the first-match principle, the scope of matching, and the "what you see is what you get" behaviour.

## [0.4.5] - 2026-05-19

### Added
- **Banner registry** (`src/banners.ts`): All banner definitions (content, visibility logic, settings keys) now live in one file. Adding a new banner only requires a new entry here — no changes needed in rendering or settings code.
- **Community Plugin migration banner**: Shown automatically to users who installed via BRAT, prompting them to switch to the Community Plugins install method. Auto-hides once the plugin is removed from BRAT. The "Show again" option in settings is hidden for users who have already migrated.
- **Periodic notes section README**: Included periodic notes feature in the README file.
- **Periodic Notes sub-folder recognition**: Weekly, monthly, quarterly, yearly, and custom period notes are now recognized across sub-folders of the configured folder. An "Include sub-folders" checkbox appears directly under each note type's folder setting (checked by default). When the Periodic Notes plugin is active for a type, sub-folders are always searched automatically.
- **Hide second date portion (multi-day notes)**: New setting nested under "Hide date portion in titles" — when enabled, also strips the second date and the connector between them (e.g., "to" or "–") from multi-day note titles, showing only the trailing text. The child setting is only visible when the parent toggle is on.

### Changed
- **Banner dismissed-state** moved from per-feature `hasSeenWelcomeBanner` flags into a unified `settings.banners` object. Existing dismissed state is migrated automatically on first load — no banners will reappear for existing users.
- **Feedback banner settings updated** to display my current questions for feedback.

## [0.4.4] - 2026-05-17

### Fixed
- **CSS Lint**: Resolved all CSS warnings flagged by the Obsidian plugin validator.
  - Replaced `!important` declarations with higher-specificity selectors throughout
  - Removed duplicate `display` property in `.multi-day-link`
  - Merged duplicate `.day-cell` selector block

### Changed
- **README**: Updated installation section — Community Plugins is now the recommended method, BRAT listed as alternative with pre-release access note and migration instructions.

## [0.4.3] - 2026-05-17

### Changed
- **Build Security**: Added GitHub artifact attestations to release workflow, allowing cryptographic verification that release assets were built directly from source.

## [0.4.2] - 2026-05-17

### Changed
- **Obsidian Community Submission Prep**: Adapted plugin to meet official Obsidian community plugin guidelines.
  - Fixed manifest description to end with a period (required by submission validator)
  - Removed unsupported `icon` field from manifest
  - Added `authorUrl` pointing to author website
  - Updated release workflow to use version tags without `v` prefix

## [0.4.1] – 2026-02-09

### Fixed
- **Quinters**:
  - Fixed Quinter example naming (Q1-Q5 → A-E)
  - Fixed Quinter example months to match my actual idea
  - Added migration to update existing user settings

## [0.4.0] - 2026-01-31

### Added
- **Periodic Notes Feature**: Show, open or create periodic notes direcly in the calendar
  - Periods: Weekly, Mothly, Quarterly, Yearly, Custom Period
  - Show periods directly in the calendar
  - Click to create or open the periodic note
  - Compatible with the "Periodic Notes" plugin
  - Format support: https://momentjs.com/docs/#/displaying/format/ (same as "Periodic Notes" plugin)
  - Custom colors for the periods
  - Custom period groups with great customization options
- **Toggle Welcome Banners**: Show the welcome banners again after dismissing
  - Note: this primarilly helps me to test them
### Changed
- **Simpler Calendar UI**
  - Changes on borders, background coloring etc.
  - Overall cleaner look
### Improved
- **Improved Calendar UI Customization**
  - Highlighted weekdays option (e.g. hihglight weekend days)
  - Show/hide day cell borders
### Fixed
- **Daily Notes Template**: templates now get added to the daily notes when created through calendar

## [0.3.1] - 2025-01-21

### Added
- **QuickNote Feature**: Create notes directly from the calendar
  - Cmd+Click on any calendar date to create a new note, drag to make multi day entry
  - Configurable note title, date method, metadata and save location
  - Customizable default data
  - Tag pill UI for easy tag management
  - Templater compatibility: Works with triggering Templater on newly created notes
- **Settings Tab Icon**: Icon now displays in settings sidebar (Obsidian 1.11+)

### Changed
- **Code Refactoring**: Major internal code cleanup to improve maintainability (DRY/SSOT principles)

### Fixed
- **Checkbox UX**: Checkboxes now only toggle when clicking the checkbox itself, not the label text
- **Tag Pill UI**: Fixed tag pill UI consistency across all settings sections

## [0.3.0] - 2025-01-19

### Added
- **Color Categories System**: Visual organization with custom colors and optional icons
  - Categories with custom colors (hex) and optional icons (emoji/Lucide)
  - Drag-to-reorder priority system (first match wins)
  - AND/OR logic for category condition matching
  - Category index row with clickable chips at top of calendar
  - Master toggle to enable/disable entire feature
  - Global setting to show/hide icons in calendar
  - Default color picker (custom color or theme accent)
- **Color Palettes**: Visual and text mode for easy color management
  - Default palette with 5 curated colors
  - Editing and source mode for easy sharing of palettes
- **Column Alignment Options**: Weekday mode (configurable start day) or date mode
- **Tabbed Settings Interface**: Basic Settings, Categories, Daily Notes, Experimental
- **Info Icon**: Clickable info icons with popup examples for category conditions
- **Default Property**: When selecting "Property" in conditions, defaults to "category"

### Changed
- Complete settings UI reorganization with improved visual hierarchy

### Fixed
- Tab icon is now correct one (calendar-range)
- Notes should now display at the correct date, independent from time zone

## [0.2.4] - 2025-01-17

### Fixed
- GitHub Actions workflow tag pattern to support v-prefixed tags

## [0.2.3] - 2025-01-17

### Added
- GitHub Actions for automated releases and CI
- Issue templates for bug reports and feature requests
- Comprehensive CHANGELOG

### Fixed
- TypeScript strict mode compatibility

## [0.2.2] - 2025-01-04

Fixed certain settings text that wouldn't update properly

## [0.2.1] - 2025-01-04

Settings enhancements noting early development phase

Calendar improvements including distinguishable icon redesign

Auto-reload when settings change or new notes created

Experimental single-day note title display options

## [0.2.0] - 2024-12-26

Major expansion of customization for date extraction from properties/filenames

Advanced filtering capabilities for files and folders

Daily notes display options (cells, following text, date hiding)

Cell width customization

Full note titles display on hover

## [0.1.0] - 2024-12-23

This is the first version of the Linear Calendar Obsidian plugin

---

[0.4.5]: https://github.com/HomefulHobo/linear-calendar-plugin-obsidian/releases/tag/0.4.5
[0.4.4]: https://github.com/HomefulHobo/linear-calendar-plugin-obsidian/releases/tag/0.4.4
[0.4.3]: https://github.com/HomefulHobo/linear-calendar-plugin-obsidian/releases/tag/0.4.3
[0.4.2]: https://github.com/HomefulHobo/linear-calendar-plugin-obsidian/releases/tag/0.4.2
[0.4.1]: https://github.com/HomefulHobo/linear-calendar-plugin-obsidian/releases/tag/0.4.1
[0.3.1]: https://github.com/HomefulHobo/linear-calendar-plugin-obsidian/releases/tag/0.3.1
[0.3.0]: https://github.com/HomefulHobo/linear-calendar-plugin-obsidian/releases/tag/0.3.0
[0.2.2]: https://github.com/HomefulHobo/linear-calendar-plugin-obsidian/releases/tag/0.2.2
[0.2.1]: https://github.com/HomefulHobo/linear-calendar-plugin-obsidian/releases/tag/0.2.1
[0.2.0]: https://github.com/HomefulHobo/linear-calendar-plugin-obsidian/releases/tag/0.2.0
[0.1.0]: https://github.com/HomefulHobo/linear-calendar-plugin-obsidian/releases/tag/0.1.0
