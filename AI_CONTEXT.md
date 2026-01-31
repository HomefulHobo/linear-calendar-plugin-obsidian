# AI Context - Linear Calendar Plugin

> **For AI Assistants**: This file contains essential context about the Linear Calendar Obsidian plugin. Always read this file when starting a new conversation about this project. Keep this file updated when significant architectural changes are made.

## Project Overview

A TypeScript-based Obsidian plugin that displays all days of the year in a linear calendar view, with support for daily notes, multi-day events, and flexible date extraction from note properties or filenames.

## Architecture

### Technology Stack
- **Language**: TypeScript (strict mode)
- **Build Tool**: esbuild
- **Target**: ES2018
- **Development**: Watch mode with `npm run dev`, production build with `npm run build`

### File Structure

```
linear-calendar/
├── .github/                      # GitHub automation and templates
│   ├── workflows/
│   │   ├── release.yml           # Automated release builds
│   │   └── ci.yml                # Continuous integration checks
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.yml        # Bug report form
│       ├── feature_request.yml   # Feature request form
│       └── config.yml            # Issue template configuration
├── src/                          # TypeScript source files
│   ├── main.ts                   # Plugin entry point
│   ├── types.ts                  # Type definitions and defaults
│   ├── CalendarView.ts           # Calendar rendering and logic
│   ├── SettingsTab.ts            # Settings UI (includes CategoryEditModal)
│   ├── QuickNoteModal.ts         # QuickNote creation modal
│   ├── IconSuggest.ts            # Icon autocomplete (500+ emojis/Lucide icons)
│   ├── FolderSuggest.ts          # Folder autocomplete (extends BaseSuggest)
│   ├── PropertySuggest.ts        # Property autocomplete (extends BaseSuggest)
│   ├── ValueSuggest.ts           # Value autocomplete (extends BaseSuggest)
│   ├── TagSuggest.ts             # Tag autocomplete (extends BaseSuggest)
│   └── helpers/                  # Reusable UI components (DRY/SSOT)
│       ├── BaseSuggest.ts        # Abstract base class for all suggest components
│       ├── TagPillRenderer.ts    # Tag pill UI with chips and autocomplete
│       ├── ConditionRenderer.ts  # Unified condition rendering for filters/categories
│       └── MetadataRowRenderer.ts # Reusable metadata key-value rows
├── styles.css                    # Plugin styles
├── main.js                       # Compiled output (generated)
├── manifest.json                 # Plugin manifest
├── package.json                  # npm configuration
├── tsconfig.json                 # TypeScript configuration
├── esbuild.config.mjs            # Build configuration
├── CHANGELOG.md                  # Version history
├── LICENSE                       # MIT License
└── .gitignore                    # Git ignore patterns
```

## Core Concepts

### 1. Date Extraction System

The plugin supports flexible date extraction with priority-based configuration:

**Start Date Sources** (configurable priority):
- **From properties**: Array of property names checked in order (top to bottom)
- **From filename**: First `YYYY-MM-DD` pattern found
- **Priority**: User can choose which source to use when both are available

**End Date Sources** (for multi-day events):
- **From properties**: Array of property names checked in order
- **From filename**: Second `YYYY-MM-DD` pattern found (note: second, not first!)
- **Priority**: User can choose which source to use when both are available

**Implementation**: See `CalendarView.ts:extractDateFromFile()` (lines 276-348)

### 2. Filter System

Simple and intuitive filtering:
- **Filter Modes**:
  - `none`: Show all notes with valid dates (default)
  - `include`: Only show notes matching ALL conditions (AND logic)
  - `exclude`: Hide notes matching ALL conditions (AND logic)
- **Conditions**: Array of property/operator/value checks
- **Operators**: is, isNot, contains, doesNotContain, startsWith, endsWith, matches (regex), exists, doesNotExist, hasTag
- **Date Pattern Matching**: matchesDatePattern operator with user-specified format (supports all Moment.js tokens)

**Implementation**: See `CalendarView.ts:filePassesFilter()` and `evaluateCondition()` (lines 186-275)

### 3. Multi-Day Events

Events spanning multiple days are rendered as horizontal bars:
- Each event gets a unique row position to avoid overlaps
- Collision detection ensures bars don't overlap
- Width calculation uses `ResizeObserver` for responsiveness
- Events spanning multiple months are split into segments per month

**Implementation**: See `CalendarView.ts:processMultiDayEntries()` and `renderMonthRow()` (lines 349-573)

### 4. Calendar Display & UI

**Note Titles and Tooltips**:
- Calendar cells are intentionally compact, causing note names to be truncated
- Custom tooltip system shows full note basename on hover for all note types
- Tooltips appear instantly on mouseenter with no delay
- Positioned near cursor (10px offset) for easy reading
- Applies to: single-day notes and multi-day event bars
- Implementation uses `mouseenter`/`mouseleave` events instead of native HTML `title` attribute

**Smart Date Hiding**:
- Optional setting to hide date portion from displayed titles
- Smart logic: If multiple dates exist in title, always shows full title to preserve context
- Examples where full title is preserved:
  - "2024-01-15 Meeting about 2024-02-20" (referencing another date)
  - "2024-01-01–2024-01-20 Event" (multi-day events with date range)

**Calendar Width Modes**:
- **Fit to screen**: Default mode, calendar adjusts to fit available screen width (table-layout: fixed)
- **Scrollable**: Calendar cells expand to minimum width, enabling horizontal scroll when needed
- Configurable minimum cell width (20-200px, default: 30px) for scrollable mode
- Uses CSS custom property `--cell-min-width` for dynamic sizing

**Calendar UI Customization** (v0.4.0):
- **Highlighted Weekdays**: Option to highlight specific days of the week (e.g., weekends)
- **Cell Borders**: Toggle to show/hide day cell borders for cleaner appearance
- **Settings Tabs**: Tabs wrap to multiple rows to prevent overflow

**Implementation**:
- Tooltip methods: `CalendarView.ts:showTooltip()`, `hideTooltip()` (lines 678-699)
- Tooltip CSS: `styles.css` (lines 594-608)
- Single-day notes: `CalendarView.ts` (lines 582-588)
- Multi-day bars: `CalendarView.ts` (lines 633-639)
- Display name logic: `CalendarView.ts:getDisplayName()` (lines 447-464)
- Calendar width mode: `CalendarView.ts` (lines 90-108)
- Width mode CSS: `styles.css` (lines 610-642)

### 5. Settings UI with Drag-and-Drop

Property lists support drag-and-drop reordering:
- Visual drag handle (⋮⋮)
- Hint text explaining priority order
- Cursor feedback (grab/grabbing)
- Visual drop target indicator (blue border)
- Automatic save on reorder

**Implementation**: See `SettingsTab.ts:renderStartPropsList()` and `renderEndPropsList()` (lines 66-157, 195-343)

### 6. Color Categories (v0.3.0)

Visual organization system for notes using colors and icons:
- **Categories**: Custom color (hex), optional icon (emoji/Lucide), filter conditions
- **Matching Logic**: First match wins (drag-to-reorder priority), categories can be enabled/disabled
- **Category Index**: Standalone section in calendar showing chips, click to edit via CategoryEditModal
- **Icon System**: IconSuggest.ts provides autocomplete for 500+ emojis and Lucide icons
- **Settings**: Master toggle to enable/disable, default color picker (custom or theme accent), global icon show/hide
- **Welcome Message**: Shows "Add color to your year!" when no categories exist

**Implementation**:
- Types: `ColorCategory`, `ColorCategoriesConfig` in `types.ts`
- Matching: `CalendarView.ts:getCategoryForFile()`, `getColorForFile()`, `getIconForFile()`
- UI: `CalendarView.ts:renderCategoryIndexRow()`, `SettingsTab.ts:CategoryEditModal`
- Icons update instantly in header via DOM query (no full refresh)

### 7. Column Alignment (v0.3.0)

Two alignment modes for calendar columns:
- **Weekday Mode**: Align by day of week (configurable week start day: Sunday-Saturday)
- **Date Mode**: Align by date number (all 1st days in same column, etc.)
- Formula: `columnOffset = (startingDayOfWeek - weekStartDay + 7) % 7`

**Implementation**: See `CalendarView.ts` column offset calculation and header rendering

### 8. QuickNote Feature (v0.3.1)

Create notes directly from the calendar with customizable metadata:
- **Trigger**: Cmd+Click on any calendar date, drag to create multi-day entries
- **Configuration**:
  - Save location (folder selection with autocomplete)
  - Filename template with date variables
  - Default metadata key-value pairs
  - Tag pill UI for easy tag management
- **Templater Compatibility**: Option to trigger Templater on newly created notes via command
- **Modal UI**: `QuickNoteModal.ts` handles note creation with metadata preview

**Implementation**:
- Modal: `QuickNoteModal.ts`
- Settings: `SettingsTab.ts` QuickNotes tab
- Types: `QuickNoteConfig` in `types.ts`

### 9. Periodic Notes Feature (v0.4.0)

Show, open, or create periodic notes directly in the calendar:
- **Supported Periods**:
  - Weekly, Monthly, Quarterly, Yearly
  - Custom Period Groups with flexible date ranges
- **Calendar Integration**: Periods shown as colored rows in calendar, click to create/open notes
- **Periodic Notes Plugin Compatibility**: Reads settings from community "Periodic Notes" plugin when enabled
- **Format Support**: Full Moment.js format support (YYYY, MM, DD, ww, gggg, Q, etc.)
- **Customization**:
  - Custom colors for each period type
  - Configurable folder locations
  - Template support for each period
  - Custom period groups with month ranges and year basis options
- **Smart Formatting**: Comprehensive date formatting with ISO week numbers, quarters, month names

**Implementation**:
- Types: `PeriodicNotesSettings`, `PeriodicNoteConfig`, `CustomPeriod` in `types.ts`
- Formatting: `CalendarView.ts:formatDate()`, helper methods for week/quarter calculation
- Regex Conversion: `CalendarView.ts:formatToRegexPattern()` for pattern matching
- Settings: `SettingsTab.ts` Periodic Notes tab

### 10. Helper Components (DRY/SSOT Architecture) (v0.3.1)

Reusable UI components to eliminate code duplication:

**BaseSuggest** (`helpers/BaseSuggest.ts`):
- Abstract base class for all autocomplete/suggestion components
- Handles positioning, keyboard navigation, item selection
- Dispatches both 'input' and 'change' events on selection (fixes property clearing bug)
- Extended by: PropertySuggest, ValueSuggest, TagSuggest, FolderSuggest

**TagPillRenderer** (`helpers/TagPillRenderer.ts`):
- Reusable tag pill UI with chips and autocomplete
- Used in QuickNoteModal and SettingsTab (Default Metadata)
- Callback-based design for decoupled updates

**ConditionRenderer** (`helpers/ConditionRenderer.ts`):
- Unified condition rendering for Filters, Categories, and CategoryEditModal
- Property options: Folder, Tags, File Name, File Basename, Extension, Path, Custom property
- Handles operator selection, value input, and tag-specific UI

**MetadataRowRenderer** (`helpers/MetadataRowRenderer.ts`):
- Reusable metadata key-value pair rows
- Auto-detects "tags" property and shows TagPillRenderer
- Ensures identical behavior in QuickNoteModal and SettingsTab

## Type Definitions

### Key Interfaces (from `types.ts`)

```typescript
interface LinearCalendarSettings {
    currentYear: number;
    dailyNoteFormat: string;
    dailyNoteFolderMode: 'obsidian' | 'custom';
    dailyNoteCustomFolder: string;
    showDailyNotesInCells: boolean;      // Show daily notes as separate cells
    showNotesWithDateAndText: boolean;   // Show notes with date + text
    hideDateInTitle: boolean;            // Hide date portion in titles
    calendarWidth: 'fit-screen' | 'scrollable';  // Calendar width mode
    cellMinWidth: number;                // Minimum cell width in pixels (for scrollable)
    dateExtraction: DateExtractionConfig;
    filterMode: 'none' | 'include' | 'exclude';
    filterConditions: Condition[];
}

interface DateExtractionConfig {
    startFromProperties: string[];      // Array, not single value!
    startFromFilename: boolean;
    startPriority: 'property' | 'filename';
    endFromProperties: string[];        // Array, not single value!
    endFromFilename: boolean;
    endPriority: 'property' | 'filename';
}

interface NoteInfo {
    file: TFile;
    startDate: Date;
    endDate: Date | null;
    isMultiDay: boolean;
}
```

## Important Implementation Details

### Date Extraction Logic
1. **Multiple properties**: Arrays are checked in order, first valid date wins
2. **End date from filename**: Uses the SECOND `YYYY-MM-DD` match, not the first
3. **Priority resolution**: Only applied when both sources provide valid dates

### Multi-Day Event Rendering
- Uses setTimeout(0) hack for width calculation (tech debt, but works)
- ResizeObserver updates widths on container resize
- Maximum 24 months to prevent infinite loops
- Collision detection uses simple overlap algorithm

### Settings UI
- Inline styles used instead of CSS classes (for rapid prototyping)
- Each property list manages its own `draggedIndex` state
- Priority sections only visible when both sources enabled
- Auto-refresh on checkbox changes to show/hide sections

### Daily Notes Integration
- Supports both Obsidian's native Daily Notes folder and custom folder
- Searches subfolders when looking for existing daily notes
- Configurable filename format (YYYY-MM-DD by default)
- Daily notes are always accessible via day number links
- Optional: Show daily notes as separate cells (default: off)
- Optional: Show notes with date+text in title (default: on)
- Optional: Hide date portion from displayed titles (default: off)

**Implementation**: See `CalendarView.ts:isDailyNote()`, `hasDateAndText()`, `getDisplayName()`, `shouldShowNote()` (lines 423-470)

## Development Workflow

### Making Changes
1. Edit TypeScript files in `src/`
2. Run `npm run dev` for watch mode (auto-rebuild)
3. Reload Obsidian plugin (Cmd+P → "Reload app without saving")

### Build Commands
- **Development**: `npm run dev` - Watch mode with inline source maps
- **Production**: `npm run build` - Single build, optimized

### Testing
- Open DevTools in Obsidian: Cmd+Option+I (Mac) or Ctrl+Shift+I (Windows/Linux)
- Check console for errors
- Verify settings persistence by reopening settings tab

## GitHub Integration

### Repository Structure
- **Repository**: https://github.com/HomefulHobo/linear-calendar-plugin-obsidian
- **License**: MIT
- **Source Code**: All TypeScript source files in `src/` directory are committed to GitHub
- **Releases**: Automated via GitHub Actions

### Automated Workflows

#### Release Workflow (`.github/workflows/release.yml`)
- **Trigger**: Pushing a tag matching `v*.*.*` or `*.*.*` (e.g., `v0.2.4`)
- **Process**:
  1. Checks out code
  2. Installs Node.js 20
  3. Runs `npm ci` to install dependencies
  4. Runs `npm run build` to compile TypeScript → JavaScript
  5. Creates GitHub release with auto-generated notes
  6. Attaches required plugin files: `main.js`, `manifest.json`, `styles.css`
- **Permissions**: Requires `contents: write` permission to upload release assets
- **Note**: Pre-releases are supported (mark as pre-release when creating)

#### CI Workflow (`.github/workflows/ci.yml`)
- **Trigger**: Push to main/master branch or pull requests
- **Process**:
  1. Checks out code
  2. Installs Node.js 20
  3. Runs `npm ci`
  4. Runs `npm run build`
  5. Runs `npx tsc --noEmit` to check for TypeScript errors
- **Purpose**: Catches build errors and type errors before release

### Issue Templates
- **Bug Report** (`.github/ISSUE_TEMPLATE/bug_report.yml`): Structured form collecting Obsidian version, plugin version, platform, steps to reproduce, expected behavior, screenshots
- **Feature Request** (`.github/ISSUE_TEMPLATE/feature_request.yml`): Form for problem description, proposed solution, alternatives, contribution willingness
- **Blank Issues**: Enabled for general questions/discussions
- **Contact Link**: Direct email contact via https://www.homefulhobo.com/contact/

### Release Process
1. **Update version numbers**:
   - `manifest.json`: Update `version` field
   - `package.json`: Update `version` field
   - `CHANGELOG.md`: Add new version section with changes
2. **Build and test locally**: Run `npm run build` and test in Obsidian
3. **Commit changes**: Using GitHub Desktop or git CLI
4. **Push to GitHub**: Ensure all changes are pushed
5. **Create release**:
   - Go to GitHub repository → Releases → "Create a new release"
   - Create tag: `v0.2.x` (with "v" prefix)
   - Add title: `v0.2.x`
   - Description: Auto-generated from commits (or write custom notes)
   - Mark as pre-release if needed
   - Click "Publish release"
6. **Automated build**: GitHub Actions automatically builds and attaches files
7. **Verify**: Check Actions tab for green checkmark, confirm files attached to release

### README Badges
- **Release Badge**: Shows latest version (includes pre-releases with `?include_prereleases` parameter)
- **CI Badge**: Shows build status (passing/failing)
- **License Badge**: Shows MIT license

### Version Control
- **Git**: Repository initialized with all source code
- **Ignored Files** (`.gitignore`):
  - `node_modules/` - Dependencies
  - `data.json` - User settings (keep private)
  - OS files (.DS_Store)
  - IDE files (.vscode/, .idea/)
  - Logs and temporary files
- **Committed Files**: All source code, configuration, documentation
- **Built Files**: `main.js` is built by CI/CD and attached to releases (not committed to repo)

## Common Patterns

### Adding a New Property to Settings
1. Update `LinearCalendarSettings` interface in `types.ts`
2. Update `DEFAULT_SETTINGS` in `types.ts`
3. Add UI in `SettingsTab.ts`
4. Use the setting in `CalendarView.ts`
5. Test and rebuild

### Adding a New Filter Operator
1. Add to `ConditionOperator` type in `types.ts`
2. Add case in `CalendarView.ts:evaluateCondition()`
3. Add option in `SettingsTab.ts:renderCondition()`
4. Test with sample notes

### Debugging Tips
- Use `console.log()` in TypeScript files
- Rebuild with `npm run build`
- Check DevTools console in Obsidian
- Source maps enabled in dev mode for easier debugging

## Known Technical Debt

1. **Multi-day bar width calculation**: Uses setTimeout(0) hack - should use proper layout measurement
2. **Inline styles**: Settings UI uses inline styles instead of CSS classes
3. **Error handling**: Limited error handling for invalid dates or regex patterns
4. **Performance**: No caching of metadata - re-reads all files on each render

## Version History

- **v0.4.0** (2026-01-31): Periodic Notes and enhanced date formatting
  - **Periodic Notes Feature**: Show, open, or create periodic notes directly in calendar
    - Periods: Weekly, Monthly, Quarterly, Yearly, Custom Period Groups
    - Click to create or open periodic notes
    - Compatible with "Periodic Notes" plugin
    - Full Moment.js format support (YYYY, MM, DD, ww, gggg, Q, etc.)
    - Custom colors and folder configurations
  - **Comprehensive Date Formatting**: Added full Moment.js token support
    - ISO week numbers (ww, w), week years (gggg)
    - Quarter support (Q)
    - Full and abbreviated month names (MMMM, MMM)
    - Enables formats like "MMMM D, YYYY", "YYYY-[W]ww", "YYYY-Q[Q]"
  - **Enhanced Daily Notes Format Field**: Matches periodic notes style
    - Clickable format reference link to Moment.js documentation
    - Live preview that updates as you type
  - **Date Pattern Matching Condition**: New flexible filtering
    - "File Name" + "matches date pattern" with user-specified format
    - Optional "require additional text" checkbox
    - Separated from simple "is" matching
  - **UI Improvements**:
    - Settings tabs now wrap to prevent overflow
    - Highlighted weekdays option (e.g., highlight weekends)
    - Toggle to show/hide day cell borders
    - Cleaner calendar appearance
  - **Code Quality**: Reusable date formatting utilities
    - `formatToRegexPattern()` for DRY pattern conversion
    - `formatDate()` with comprehensive token support
    - Helper methods: `getISOWeek()`, `getISOWeekYear()`, `getQuarter()`, `getMonthName()`
  - **Fixes**: Daily notes templates now get added when created through calendar

- **v0.3.1** (2025-01-21): QuickNote feature and DRY refactoring
  - **QuickNote Feature**: Create notes directly from calendar
    - Cmd+Click on any date to create a new note, drag to make multi-day entries
    - Configurable note title, date method, metadata and save location
    - Tag pill UI for easy tag management
    - Templater compatibility: Works with triggering Templater on newly created notes
  - **Settings Tab Icon**: Icon now displays in settings sidebar (Obsidian 1.11+)
  - **DRY/SSOT Refactoring**: Major code cleanup (~800 lines reduced)
    - Created `BaseSuggest` abstract class for all autocomplete components
    - Created `TagPillRenderer`, `ConditionRenderer`, `MetadataRowRenderer` helpers
    - Refactored all suggest classes to extend BaseSuggest
  - **Improved Terminology**: "File Name" and "File Basename" (was "Name with/without extension")
  - **Fixes**: Property clearing bug, checkbox UX, tag pill UI consistency

- **v0.3.0** (2025-01-19): Color categories and calendar enhancements
  - **Color Categories System**: Visual organization with colors and icons
    - Categories with custom colors (hex) and optional icons (emoji/Lucide)
    - Drag-to-reorder priority, first match wins
    - Category index row with clickable chips opening modal editor
    - Master toggle to enable/disable feature
    - Default color picker (custom or theme accent)
    - Color palettes (visual and text mode) for easy color management
    - AND/OR logic for category condition matching
  - **Column Alignment**: Weekday mode (configurable start day) or date mode
  - **Tabbed Settings Interface**: Basic Settings, Categories, Daily Notes, Experimental
  - **User Feedback System**: Feedback box in settings with links to GitHub and email
  - **Icon System**: IconSuggest autocomplete for 500+ emojis/Lucide icons, global show/hide toggle
  - **UI Improvements**: Complete settings reorganization with improved visual hierarchy, palette button uses Lucide 'palette' icon
  - **Fixes**: Tab icon (calendar-range), notes display at correct date independent from timezone, icon preview positioning, palette section stays open when adding/removing palettes, category index opens settings when clicking chips, experimental badge alignment

- **v0.2.4** (2025-01-17): GitHub Actions integration
  - Fixed workflow tag pattern to support v-prefixed tags
  - Fixed workflow permissions for automated releases
  - Added comprehensive GitHub automation (CI/CD)

- **v0.2.3** (2025-01-17): GitHub infrastructure setup
  - GitHub Actions for automated releases and CI
  - Issue templates for bug reports and feature requests
  - Comprehensive CHANGELOG.md
  - TypeScript strict mode compatibility fixes
  - Professional README with status badges

- **v0.2.2** (2025-01-04): Settings text updates
  - Fixed certain settings text that wouldn't update properly

- **v0.2.1** (2025-01-04): Early development notice
  - Settings enhancements noting early development phase
  - Calendar improvements including distinguishable icon redesign
  - Auto-reload when settings change or new notes created
  - Experimental single-day note title display options

- **v0.2.0** (2024-12-26): Major customization update
  - Major expansion of customization for date extraction from properties/filenames
  - Advanced filtering capabilities for files and folders
  - Daily notes display options (cells, following text, date hiding)
  - Cell width customization
  - Full note titles display on hover

- **v0.1.0** (2024-12-23): Initial release
  - Initial TypeScript setup with redesigned settings
  - Simplified date extraction (property arrays instead of single values)
  - Simplified filter system (include/exclude instead of complex rules)
  - Drag-and-drop property ordering with hints
  - Multi-day event support with collision detection

## Future Considerations

Potential features to add:
- Search/filter within calendar view
- Keyboard navigation
- Loading indicators for large vaults
- Caching system for better performance
- Export/import settings
- Preset configurations

## AI Instructions

When working on this project:
1. **Always read types.ts first** to understand the data model
2. **Prefer editing existing files** over creating new ones
3. **Follow existing patterns** for consistency
4. **Run build after changes** and verify in Obsidian
5. **Update this file** when making significant architectural changes
6. **Keep TypeScript strict mode** - fix all type errors
7. **Test edge cases** like invalid dates, missing properties, empty arrays

### Before Making Changes
- Read the relevant section of this context file
- Check `types.ts` for current data structures
- Review existing implementation in `CalendarView.ts` or `SettingsTab.ts`

### After Making Changes
- Run `npm run build` to compile
- Test in Obsidian by reloading the plugin
- Update this context file if architecture changed
- Check for TypeScript errors in output

---

**Last Updated**: 2026-01-31
**Plugin Version**: 0.4.0
**Maintained for**: Claude Code and other AI assistants
