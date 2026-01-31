# Periodic Notes Feature Plan

## Overview
Add comprehensive periodic notes support to Linear Calendar:
- **Weekly** - Compatible with Calendar/Periodic Notes plugins
- **Monthly** - Compatible with Periodic Notes plugin
- **Quarterly** - Q1-Q4 periods
- **Yearly** - Compatible with Periodic Notes plugin
- **Custom Periods** - User-defined month ranges (semesters, seasons, trimesters, etc.)

## Moment.js Format Tokens Reference

### Week-related
| Token | Output | Description |
|-------|--------|-------------|
| `w` | 1-53 | Locale week of year |
| `ww` | 01-53 | Locale week of year (2-digit) |
| `W` | 1-53 | ISO week of year |
| `WW` | 01-53 | ISO week of year (2-digit) |
| `gg` | 25 | Locale week year (2-digit) |
| `gggg` | 2025 | Locale week year (4-digit) |
| `GG` | 25 | ISO week year (2-digit) |
| `GGGG` | 2025 | ISO week year (4-digit) |

### Month-related
| Token | Output | Description |
|-------|--------|-------------|
| `M` | 1-12 | Month number |
| `MM` | 01-12 | Month number (2-digit) |
| `MMM` | Jan | Month name (short) |
| `MMMM` | January | Month name (full) |
| `Q` | 1-4 | Quarter |
| `Qo` | 1st-4th | Quarter (ordinal) |

### Year-related
| Token | Output | Description |
|-------|--------|-------------|
| `YY` | 25 | 2-digit year |
| `YYYY` | 2025 | 4-digit year |

### Day-related
| Token | Output | Description |
|-------|--------|-------------|
| `D` | 1-31 | Day of month |
| `DD` | 01-31 | Day of month (2-digit) |
| `d` | 0-6 | Day of week (0=Sunday) |
| `dddd` | Monday | Day name (full) |
| `DDD` | 1-365 | Day of year |

## Default Formats

| Type | Default Format | Example |
|------|----------------|---------|
| Daily | `YYYY-MM-DD` | 2025-01-26 |
| Weekly | `gggg-[W]ww` | 2025-W04 |
| Monthly | `YYYY-MM` | 2025-01 |
| Quarterly | `YYYY-[Q]Q` | 2025-Q1 |
| Yearly | `YYYY` | 2025 |
| Custom | (user defined) | 2025-A, Winter-2025 |

## Architecture

### Types (types.ts)

```typescript
interface PeriodicNoteConfig {
    enabled: boolean;
    folder: string;
    format: string;
    template: string;
}

interface CustomPeriod {
    id: string;           // Unique identifier
    name: string;         // Display name (e.g., "Semester", "Season")
    format: string;       // Filename format (e.g., "YYYY-[S]1", "YYYY-[Winter]")
    folder: string;       // Storage folder
    template: string;     // Template file path
    months: number[];     // Array of months (1-12), can wrap around year
    color?: string;       // Optional color for visual indicator
}

// Examples of custom periods:
// Semesters: { months: [1,2,3,4,5,6], format: "YYYY-[S1]" }
//            { months: [7,8,9,10,11,12], format: "YYYY-[S2]" }
// Seasons:   { months: [12,1,2], format: "YYYY-[Winter]" }  // wraps year!
//            { months: [3,4,5], format: "YYYY-[Spring]" }
//            { months: [6,7,8], format: "YYYY-[Summer]" }
//            { months: [9,10,11], format: "YYYY-[Fall]" }
// Trimesters: { months: [1,2,3,4], format: "YYYY-[A]" }
//             { months: [5,6,7,8], format: "YYYY-[B]" }
//             { months: [9,10,11,12], format: "YYYY-[C]" }

interface PeriodicNotesSettings {
    usePeriodicNotesPlugin: boolean;  // Use Periodic Notes plugin settings if available
    weekStart: 0 | 1 | 2 | 3 | 4 | 5 | 6;  // 0=Sunday, 1=Monday, etc.
    showWeekNumbers: boolean;
    showQuarters: boolean;
    showCustomPeriods: boolean;
    weekly: PeriodicNoteConfig;
    monthly: PeriodicNoteConfig;
    quarterly: PeriodicNoteConfig;
    yearly: PeriodicNoteConfig;
    customPeriods: CustomPeriod[];
}

// Defaults
const DEFAULT_PERIODIC_NOTES: PeriodicNotesSettings = {
    usePeriodicNotesPlugin: true,
    weekStart: 1,  // Monday
    showWeekNumbers: true,
    showQuarters: false,
    showCustomPeriods: false,
    weekly: {
        enabled: false,
        folder: '',
        format: 'gggg-[W]ww',
        template: ''
    },
    monthly: {
        enabled: false,
        folder: '',
        format: 'YYYY-MM',
        template: ''
    },
    quarterly: {
        enabled: false,
        folder: '',
        format: 'YYYY-[Q]Q',
        template: ''
    },
    yearly: {
        enabled: false,
        folder: '',
        format: 'YYYY',
        template: ''
    },
    customPeriods: []
};
```

### Settings Tab Structure

```
Settings Tabs:
├── Basic Settings (existing)
├── Categories (existing)
├── Daily Notes (existing)
├── Periodic Notes (NEW)
│   ├── General
│   │   ├── [x] Use Periodic Notes plugin settings (if installed)
│   │   ├── Week starts on: [Monday ▼]
│   │   ├── [x] Show week numbers in calendar
│   │   ├── [x] Show quarters in calendar
│   │   └── [x] Show custom periods in calendar
│   │
│   ├── Weekly Notes
│   │   ├── [x] Enable weekly notes
│   │   ├── Folder: [________________] 📁
│   │   ├── Format: [gggg-[W]ww_____] ℹ️
│   │   └── Template: [______________] 📄
│   │
│   ├── Monthly Notes
│   │   ├── [x] Enable monthly notes
│   │   ├── Folder: [________________] 📁
│   │   ├── Format: [YYYY-MM________] ℹ️
│   │   └── Template: [______________] 📄
│   │
│   ├── Quarterly Notes
│   │   ├── [x] Enable quarterly notes
│   │   ├── Folder: [________________] 📁
│   │   ├── Format: [YYYY-[Q]Q______] ℹ️
│   │   └── Template: [______________] 📄
│   │
│   ├── Yearly Notes
│   │   ├── [x] Enable yearly notes
│   │   ├── Folder: [________________] 📁
│   │   ├── Format: [YYYY___________] ℹ️
│   │   └── Template: [______________] 📄
│   │
│   └── Custom Periods
│       ├── [+ Add Custom Period]
│       └── Period List (drag to reorder)
│           ├── 📋 Semester 1 (Jan-Jun) [Edit] [Delete]
│           ├── 📋 Semester 2 (Jul-Dec) [Edit] [Delete]
│           └── ...
│
├── QuickNotes (existing)
└── Experimental (existing)
```

### Custom Period Edit Modal

```
┌─────────────────────────────────────────────┐
│ Edit Custom Period                      [X] │
├─────────────────────────────────────────────┤
│ Name: [Semester 1_______________]           │
│                                             │
│ Months:                                     │
│ [x] Jan [x] Feb [x] Mar [x] Apr            │
│ [x] May [x] Jun [ ] Jul [ ] Aug            │
│ [ ] Sep [ ] Oct [ ] Nov [ ] Dec            │
│                                             │
│ Note: Months can wrap across year boundary  │
│ (e.g., Dec-Jan-Feb for Winter)              │
│                                             │
│ Folder: [Semesters______________] 📁        │
│                                             │
│ Format: [YYYY-[S1]______________] ℹ️        │
│ Preview: 2025-S1                            │
│                                             │
│ Template: [_____________________] 📄        │
│                                             │
│ Color: [#4a90d9] 🎨 (optional)              │
│                                             │
│              [Cancel]  [Save]               │
└─────────────────────────────────────────────┘
```

## Calendar Visual Layout

### Full Layout with All Columns

```
| Custom | Qtr | Month | Wk | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|--------|-----|-------|----|-----|-----|-----|-----|-----|-----|-----|
|        |     | Jan   | 01 |     |     |  01 |  02 |  03 |  04 |  05 |
| 2025-A |     |       | 02 |  06 |  07 |  08 |  09 |  10 |  11 |  12 |
|        |     |       | 03 |  13 |  14 |  15 |  16 |  17 |  18 |  19 |
|        |     |       | 04 |  20 |  21 |  22 |  23 |  24 |  25 |  26 |
|        | Q1  |       | 05 |  27 |  28 |  29 |  30 |  31 |     |     |
|        |     | Feb   | 05 |     |     |     |     |     |  01 |  02 |
|        |     |       | 06 |  03 |  04 |  05 |  06 |  07 |  08 |  09 |
|        |     |       | ... |     |     |     |     |     |     |     |
|--------|-----|-------|----|-----|-----|-----|-----|-----|-----|-----|
| 2025-B |     | Mar   | 09 |     |     |     |     |     |  01 |  02 |
|        |     |       | 10 |  03 |  04 |  05 |  06 |  07 |  08 |  09 |
|        |     | Apr   | ... |     |     |     |     |     |     |     |
|        | Q2  | May   | ... |     |     |     |     |     |     |     |
|--------|-----|-------|----|-----|-----|-----|-----|-----|-----|-----|
```

### Column Behavior

**Custom Period Column:**
- Spans vertically across all months in the period
- Shows period label (e.g., "2025-A", "Winter 2025")
- Clickable → opens/creates custom period note
- Optional background color
- Only visible when custom periods are enabled and defined

**Quarter Column:**
- Spans vertically across 3 months (Q1: Jan-Mar, Q2: Apr-Jun, etc.)
- Shows "Q1", "Q2", "Q3", "Q4"
- Clickable → opens/creates quarterly note
- Only visible when quarters are enabled

**Week Column:**
- Shows week number for each week row
- Clickable → opens/creates weekly note
- Only visible when week numbers are enabled

### Year Wrapping for Custom Periods

For periods like Winter (Dec-Jan-Feb):
- December 2024 shows "Winter 2025" (based on when the period mostly occurs)
- OR user can configure which year to use

```typescript
interface CustomPeriod {
    // ... other fields
    yearBasis: 'start' | 'end' | 'majority';
    // 'start' = use year of first month in period
    // 'end' = use year of last month in period
    // 'majority' = use year where most months fall
}
```

## Plugin Compatibility

### Detection Logic

```typescript
getPeriodicNotesSettings(type: 'weekly' | 'monthly' | 'quarterly' | 'yearly'): PeriodicNoteConfig {
    // 1. Check if user wants to use Periodic Notes plugin
    if (this.plugin.settings.periodicNotes.usePeriodicNotesPlugin) {
        const periodicNotes = this.app.plugins.plugins['periodic-notes'];
        if (periodicNotes?.settings?.[type]?.enabled) {
            return periodicNotes.settings[type];
        }
    }

    // 2. Fall back to our own settings
    return this.plugin.settings.periodicNotes[type];
}
```

### Calendar Plugin Compatibility

The Calendar plugin reads from Periodic Notes plugin, so if we're compatible with Periodic Notes, we're automatically compatible with Calendar.

**Note:** Custom periods are unique to our plugin and won't sync with other plugins.

## Implementation Phases

### Phase 1: Settings Infrastructure
1. Add `PeriodicNotesSettings` and related types to types.ts
2. Create "Periodic Notes" settings tab
3. Add settings UI for weekly, monthly, quarterly, yearly
4. Implement settings persistence
5. Add format info tooltips with token reference

### Phase 2: Week Numbers Display
1. Calculate week numbers for each row
2. Add week number column to calendar
3. Style the week number cells
4. Make week numbers clickable
5. Add visual indicator for existing weekly notes

### Phase 3: Weekly Note Creation
1. Implement `getWeeklyNoteSettings()`
2. Implement `findWeeklyNote()`
3. Implement `createWeeklyNote()`
4. Implement `openOrCreateWeeklyNote()`
5. Process weekly template variables

### Phase 4: Quarterly Notes
1. Add quarter column to calendar
2. Calculate quarters for month grouping
3. Make quarters clickable
4. Implement quarterly note creation
5. Process quarterly template variables

### Phase 5: Monthly & Yearly Notes
1. Make month names clickable → monthly note
2. Make year in header clickable → yearly note
3. Implement note creation for both
4. Process template variables

### Phase 6: Custom Periods
1. Create CustomPeriodEditModal
2. Add custom period management UI
3. Implement month range spanning
4. Handle year boundary wrapping
5. Add custom period column to calendar
6. Implement custom period note creation

### Phase 7: Template Variables

**Weekly:**
- `{{title}}` - Filename
- `{{date}}` / `{{date:FORMAT}}` - First day of week
- `{{sunday:FORMAT}}` through `{{saturday:FORMAT}}`
- `{{week}}` - Week number
- `{{year}}` - Year

**Monthly:**
- `{{title}}` - Filename
- `{{date}}` / `{{date:FORMAT}}` - First day of month
- `{{month}}` / `{{month:FORMAT}}` - Month
- `{{year}}` - Year

**Quarterly:**
- `{{title}}` - Filename
- `{{date}}` / `{{date:FORMAT}}` - First day of quarter
- `{{quarter}}` - Quarter number (1-4)
- `{{year}}` - Year

**Yearly:**
- `{{title}}` - Filename
- `{{date}}` / `{{date:FORMAT}}` - First day of year
- `{{year}}` - Year

**Custom Period:**
- `{{title}}` - Filename
- `{{date}}` / `{{date:FORMAT}}` - First day of period
- `{{period}}` - Period name
- `{{year}}` - Year
- `{{startMonth}}` / `{{endMonth}}` - First/last month names

## File Changes Summary

| File | Changes |
|------|---------|
| `types.ts` | Add `PeriodicNotesSettings`, `PeriodicNoteConfig`, `CustomPeriod`, defaults |
| `SettingsTab.ts` | Add "Periodic Notes" tab, CustomPeriodEditModal |
| `CalendarView.ts` | Week/quarter/custom columns, click handlers, note creation |
| `styles.css` | Column styles, spanning cells, hover states |

## Testing Checklist

### Settings
- [ ] Periodic Notes tab displays correctly
- [ ] Settings save and load properly
- [ ] "Use Periodic Notes plugin" toggle works
- [ ] Settings read from Periodic Notes plugin when enabled
- [ ] Custom period add/edit/delete works
- [ ] Custom period drag reorder works

### Week Numbers
- [ ] Week numbers display in correct column
- [ ] Week numbers calculate correctly (locale vs ISO)
- [ ] Week start day setting affects display
- [ ] Week numbers hide when disabled
- [ ] Visual indicator for existing weekly notes

### Quarters
- [ ] Quarters display and span 3 months
- [ ] Clicking quarter creates/opens note
- [ ] Quarters hide when disabled

### Custom Periods
- [ ] Custom periods span correct months
- [ ] Year wrapping works (Dec-Jan-Feb)
- [ ] Clicking custom period creates/opens note
- [ ] Custom period colors display
- [ ] Multiple custom periods don't overlap visually

### Note Creation
- [ ] All note types create with correct filename
- [ ] Templates apply correctly
- [ ] Template variables process correctly
- [ ] Templater processes templates (if enabled)

### Compatibility
- [ ] Works without Periodic Notes installed
- [ ] Uses Periodic Notes settings when installed
- [ ] Calendar plugin can still work alongside
