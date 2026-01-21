# Changelog

All notable changes to the Linear Calendar plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.3.1] - 2025-01-21

### Added
- **QuickNote Feature**: Create notes directly from the calendar
  - Customizable default template
  - Click on any calendar cell to create a new note
  - Configurable note folder, filename template, and metadata
  - Tag pill UI for easy tag management
  - Templater compatibility: Trigger Templater on newly created notes via command
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

[0.3.1]: https://github.com/HomefulHobo/linear-calendar-plugin-obsidian/releases/tag/0.3.1
[0.3.0]: https://github.com/HomefulHobo/linear-calendar-plugin-obsidian/releases/tag/0.3.0
[0.2.2]: https://github.com/HomefulHobo/linear-calendar-plugin-obsidian/releases/tag/0.2.2
[0.2.1]: https://github.com/HomefulHobo/linear-calendar-plugin-obsidian/releases/tag/0.2.1
[0.2.0]: https://github.com/HomefulHobo/linear-calendar-plugin-obsidian/releases/tag/0.2.0
[0.1.0]: https://github.com/HomefulHobo/linear-calendar-plugin-obsidian/releases/tag/0.1.0
