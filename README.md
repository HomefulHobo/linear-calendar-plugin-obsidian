# Linear Calendar for Obsidian

[![GitHub release](https://img.shields.io/github/v/release/HomefulHobo/linear-calendar-plugin-obsidian?include_prereleases)](https://github.com/HomefulHobo/linear-calendar-plugin-obsidian/releases/latest)
[![CI](https://github.com/HomefulHobo/linear-calendar-plugin-obsidian/actions/workflows/ci.yml/badge.svg)](https://github.com/HomefulHobo/linear-calendar-plugin-obsidian/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A linear calendar plugin that displays all 365 days of the year in a single view. Perfect for visualizing your notes chronologically, tracking events across time, and managing daily notes.

![Linear Calendar Screenshot](screenshots/main-view.png)

## ⚠️ Development Status

This plugin is in **early development** and may undergo significant changes. The core functionality—how notes are recognized and dates are extracted—will remain stable. If you use properties or dates in filenames, these will continue to work.

New features are actively being developed. If you encounter any issues or have feedback, please reach out via [GitHub](https://github.com/HomefulHobo/linear-calendar-plugin-obsidian/) or via [e-mail](https://www.homefulhobo.com/contact/).

This plugin is being developed with the help of AI.

## ✨ Features

### 📝 Note Display

- **Single-day notes**: Notes appear in their respective day cells
- **Multi-day events**: Events spanning multiple days shown as horizontal bars
- **Clickable notes**: Click any note to open it instantly
- **Instant tooltips**: Hover over any note to see the full title immediately
- **Note preview**: Cmd/Ctrl + hover to see a preview of any note

### 📆 Daily Notes Integration

![Settings Daily Notes Screenshot](screenshots/settings-daily-notes.png)

### 🔍 Flexible Date Extraction

Extract dates from multiple sources with customizable priority:

**Start Date Sources:**
- Properties (configurable, checked in order)
- Filename (first YYYY-MM-DD pattern)

**End Date Sources (for multi-day events):**
- Properties (configurable, checked in order)
- Filename (second YYYY-MM-DD pattern)

**Examples:**
```yaml
---
date: 2024-01-15
date_end: 2024-01-20
---
```

Or use filenames:
- `2024-01-15 Meeting.md` → Single-day note on Jan 15
- `2024-01-15 – 2024-01-20 Conference.md` → Multi-day event Jan 15-20

![Settings Date Extraction Screenshot](screenshots/settings-date-extraction.png)

### 🎨 Customization Options

**Calendar Appearance:**
- **Width modes**: Fit to screen (default) or scrollable with fixed cell widths
- **Configurable cell width**: Set minimum cell width (20-200px) for scrollable mode
- **Column alignment**: Weekday mode (align by day of week) or date mode (align by date number)
- **Week start day**: Configure first day of week (Sunday-Saturday)

**Display Options:**
- Show/hide daily notes in calendar cells
- Show/hide notes with date + text in title
- Optional date hiding: Display "Meeting Notes" instead of "2024-01-15 Meeting Notes"

### 📝 Quick Note Creation

- Create notes directly from the calendar
- Click on any calendar date to create a new note, drag to make multi day entry
- Configure note title, date method, metadata and save location
- Customize default data

![Quick Note Multiple Screenshot](screenshots/quick-note-multiple.png)

### 🔎 Advanced Filtering

Filter which notes appear in the calendar:

**Filter Modes:**
- **Show all notes**: Display every note with a valid date (default)
- **Include mode**: Only show notes matching ALL conditions
- **Exclude mode**: Hide notes matching ALL conditions

**Available Conditions:**
- File properties (name, folder, path, extension)
- Custom frontmatter properties
- Text operators: is, contains, starts with, ends with, regex
- Special operators: exists, has tag, matches date pattern

**Example Use Cases:**
- Only show notes in "Projects" folder
- Exclude notes tagged with #draft
- Show only notes with a specific property

![Settings Filters Screenshot](screenshots/settings-filters.png)

### 🎨 Color Categories

Organize and visualize your notes with custom colors and icons:

**Visual Organization:**
- **Custom colors**: Assign hex colors to categorize notes
- **Optional icons**: Add emoji or Lucide icons to categories
- **Condition-based matching**: Use the same powerful conditions as filters
- **AND/OR logic**: Match all conditions (AND) or any condition (OR)
- **Priority system**: Drag to reorder categories—first match wins

**Category Index:**
- Displays all categories as clickable chips at the top of the calendar
- Click any category to open the category editor
- Shows color and icon for quick visual reference

**Display Options:**
- Master toggle to enable/disable color categories
- Global setting to show/hide icons in calendar
- Set default color for uncategorized notes (custom or theme accent)

![Settings Color Categories Screenshot](screenshots/settings-color-categories.png)
![Settings Chip Color Categories Screenshot](screenshots/chip-settings-color-categories.png)

## 📥 Installation

### Via BRAT (Recommended)

[BRAT](https://github.com/TfTHacker/obsidian42-brat) (Beta Reviewers Auto-update Tester) is the recommended installation method because it's easy to use and allows you to automatically receive the newest updates.

1. Install the BRAT plugin from Obsidian's Community Plugins
2. Open BRAT settings (Settings → BRAT)
3. Click "Add Beta plugin"
4. Enter this repository: `https://github.com/HomefulHobo/linear-calendar-plugin-obsidian`
5. Click "Select a version"
6. Choose "Latest version"
7. Check "Enable after installing the plugin"
8. Click "Add Plugin"
9. Check if Linear Calendar is enabled in Settings → Community Plugins

### From Obsidian Community Plugins
*Coming soon - plugin will be submitted to the official community plugins directory*

## 🚀 Getting Started

1. **Open the calendar**: Click the calendar icon in the ribbon or use the command palette (Cmd/Ctrl+P → "Open Linear Calendar")

2. **Configure date extraction**: Go to Settings → Linear Calendar → Date Extraction
   - Add property names like `date`, `lincal_date`, or `scheduled`
   - Enable filename extraction if you use dates in filenames
   - Set priority if using both sources

3. **Add notes to your calendar**:
   - Use frontmatter properties:
     ```yaml
     ---
     date: 2024-01-15
     ---
     ```
   - Or include dates in filenames: `2024-01-15 Meeting.md`

4. **Create multi-day events**:
   - Add an end date property:
     ```yaml
     ---
     date: 2024-01-15
     date_end: 2024-01-20
     ---
     ```
   - Or use two dates in filename: `2024-01-15 – 2024-01-20 Conference.md`

5. **Customize appearance**: Adjust calendar width, cell size, and display options in settings

## 🤝 Contributing

Contributions are welcome! Please feel free to email me.

## 💚 Support

If you find this plugin helpful, consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs or requesting features
- 📢 Sharing it with others
