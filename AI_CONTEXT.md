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
│   ├── SettingsTab.ts            # Settings UI
│   └── FolderSuggest.ts          # Folder autocomplete helper
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
- **Operators**: is, isNot, contains, doesNotContain, startsWith, endsWith, matches (regex), exists, doesNotExist, hasTag, matchesDatePattern

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
- Custom colors per filter rule or tag
- Week numbers display
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

**Last Updated**: 2025-01-18
**Plugin Version**: 0.2.4
**Maintained for**: Claude Code and other AI assistants
