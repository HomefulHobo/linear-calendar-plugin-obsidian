import { TFile } from 'obsidian';

export interface LinearCalendarSettings {
    currentYear: number;
    dailyNoteFormat: string;
    dailyNoteFolderMode: 'obsidian' | 'custom';
    dailyNoteCustomFolder: string;
    showDailyNotesInCells: boolean;  // Show daily notes as separate note cells
    showNotesWithDateAndText: boolean;  // Show notes with date + text in title
    hideDateInTitle: boolean;  // Hide the date portion in note titles
    calendarWidth: 'fit-screen' | 'scrollable';  // Calendar width mode
    cellMinWidth: number;  // Minimum width per day cell in pixels (when scrollable)
    columnAlignment: 'weekday' | 'date';  // Align columns by weekday or by date
    weekStartDay: number;  // 0 = Sunday, 1 = Monday, etc.
    highlightedWeekdays: number[];  // Weekdays to highlight (0 = Sunday, 6 = Saturday)
    showCellBorders: boolean;  // Show thin borders around day cells
    showWeekSpanBorders: boolean;  // Show borders on bottom of week span cells (header-row mode)

    // Simplified date extraction settings
    dateExtraction: DateExtractionConfig;

    // Optional filtering
    filterMode: 'none' | 'include' | 'exclude';
    filterConditions: Condition[];

    // Color categories
    colorCategories: ColorCategoriesConfig;

    // Quick note creation
    quickNoteCreation: QuickNoteCreationConfig;

    // Periodic notes (weekly, monthly, quarterly, yearly, custom)
    periodicNotes: PeriodicNotesSettings;

    // Experimental features
    experimental: ExperimentalFeatures;
}

export interface ExperimentalFeatures {
    multilineNotes: boolean;        // Allow note names to wrap to multiple lines
    verticalText: boolean;          // Rotate text vertically (90 degrees)
    compactFontSize: boolean;       // Use smaller font size for notes
    condensedLetters: boolean;      // Reduce letter spacing to fit more text
}

export interface DateExtractionConfig {
    // Start date
    startFromProperties: string[];  // Array of property names to check
    startFromFilename: boolean;
    startPriority: 'property' | 'filename';  // Which to use first if both enabled

    // End date
    endFromProperties: string[];  // Array of property names to check
    endFromFilename: boolean;  // Second YYYY-MM-DD in filename
    endPriority: 'property' | 'filename';  // Which to use first if both enabled
}

export interface Condition {
    property: string;
    operator: ConditionOperator;
    value: string;
    includeSubfolders?: boolean;
    requireAdditionalText?: boolean;
}

export interface ColorCategory {
    id: string;
    name: string;
    color: string;  // Hex color
    iconType: 'emoji' | 'lucide' | null;  // null = no icon
    iconValue: string;  // Empty string if iconType is null
    conditions: Condition[];  // Reuse existing Condition type
    matchMode: 'all' | 'any';  // 'all' = AND (all must match), 'any' = OR (any can match)
    enabled: boolean;
}

export interface ColorPalette {
    name: string;
    colors: ColorPaletteEntry[];
}

export interface ColorPaletteEntry {
    name: string;
    hex: string;
}

export interface ColorCategoriesConfig {
    enabled: boolean;  // Master toggle to enable/disable entire color categories feature
    categories: ColorCategory[];
    defaultCategoryColor: string | null;  // null = use theme accent
    showCategoryIndex: boolean;
    showIconsInCalendar: boolean;  // Global setting to show/hide icons in note titles
    colorPalettes: ColorPalette[];  // User-defined color palettes
}

export interface MetadataEntry {
    key: string;
    value: string;
}

export interface QuickNoteCreationConfig {
    enabled: boolean;                           // Master toggle
    showAddNoteButton: boolean;                 // Show "Add Note" button in top bar
    hasSeenWelcomeBanner: boolean;              // Track if user has dismissed welcome banner
    defaultFolder: 'default' | 'dailynotes' | 'custom';  // Folder mode
    customFolder: string;                       // Custom folder path
    defaultStartDateProperty: string;           // Default: "date"
    defaultEndDateProperty: string;             // Default: "endDate"
    defaultCategoryProperty: string;            // Default: "category"
    defaultMetadata: MetadataEntry[];           // Default metadata entries
}

export type ConditionOperator =
    | 'is'
    | 'isNot'
    | 'contains'
    | 'doesNotContain'
    | 'startsWith'
    | 'endsWith'
    | 'matches'
    | 'exists'
    | 'doesNotExist'
    | 'hasTag'
    | 'matchesDatePattern';

export interface NoteInfo {
    file: TFile;
    startDate: Date;
    endDate: Date | null;
    isMultiDay: boolean;
}

export interface MultiDayEntry {
    file: TFile;
    startDate: Date;
    endDate: Date;
    month: number;
    year: number;
}

// Periodic Notes Types
export interface PeriodicNoteConfig {
    enabled: boolean;
    folder: string;
    format: string;
    template: string;
    color?: string;  // Optional color for visual indicator in calendar
}

export interface CustomPeriod {
    id: string;           // Unique identifier
    name: string;         // Display name (e.g., "Semester 1", "Winter")
    format: string;       // Filename format (e.g., "YYYY-[S]1", "YYYY-[Winter]")
    months: number[];     // Array of months (1-12), must be consecutive (can wrap year)
    yearBasis: 'start' | 'end' | 'majority';  // Which year to use when spanning year boundary
    useGroupSettings: boolean;  // If true, use group's folder/template/color; if false, use custom
    folder: string;       // Custom folder (only used if useGroupSettings is false)
    template: string;     // Custom template (only used if useGroupSettings is false)
    color?: string;       // Custom color (only used if useGroupSettings is false)
}

export interface CustomPeriodGroup {
    id: string;           // Unique identifier
    name: string;         // Group name (e.g., "Semesters", "Seasons", "Trimesters")
    enabled: boolean;     // Toggle for showing this group's column
    folder: string;       // Default folder for all periods in group
    template: string;     // Default template for all periods in group
    color?: string;       // Default color for all periods in group
    periods: CustomPeriod[];  // Periods within this group (months cannot overlap)
}

export type WeekNumberDisplay = 'none' | 'above-day' | 'extra-column' | 'header-row';

export type WeekBorderColorMode = 'neutral' | 'accent' | 'custom';

export interface WeekBorderColorConfig {
    mode: WeekBorderColorMode;
    customColor?: string;  // Used when mode is 'custom'
}

export interface PeriodicNotesSettings {
    usePeriodicNotesPlugin: boolean;  // Use Periodic Notes plugin settings if available
    templateFolderSource: 'obsidian' | 'custom';  // Where to get templates from
    templateCustomFolder: string;  // Custom template folder path
    weekStart: 0 | 1 | 2 | 3 | 4 | 5 | 6;  // 0=Sunday, 1=Monday, etc.
    weekNumberDisplay: WeekNumberDisplay;  // How to display week numbers in the calendar
    weekBorderColor: WeekBorderColorConfig;  // Border color between weeks in header-row mode
    showWeekNumbers: boolean;
    showQuarters: boolean;
    hasSeenWelcomeBanner: boolean;  // Track if user has dismissed periodic notes welcome banner
    weekly: PeriodicNoteConfig;
    monthly: PeriodicNoteConfig;
    quarterly: PeriodicNoteConfig;
    yearly: PeriodicNoteConfig;
    customPeriodGroups: CustomPeriodGroup[];  // Groups of custom periods, each gets own column
}

export const DEFAULT_PERIODIC_NOTES: PeriodicNotesSettings = {
    usePeriodicNotesPlugin: true,
    templateFolderSource: 'obsidian',  // Use Obsidian's template folder by default
    templateCustomFolder: '',
    weekStart: 1,  // Monday
    weekNumberDisplay: 'header-row',  // Default to row above month with week spans
    weekBorderColor: {
        mode: 'neutral',  // Neutral border color by default
    },
    showWeekNumbers: true,
    showQuarters: false,
    hasSeenWelcomeBanner: false,
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
    customPeriodGroups: [
        {
            id: 'quinter-example',
            name: 'Quinter',
            enabled: false,
            folder: '',
            template: '',
            periods: [
                {
                    id: 'q1',
                    name: 'Q1',
                    format: 'YYYY-[Q1]',
                    months: [1, 2, 3],
                    yearBasis: 'start',
                    useGroupSettings: true,
                    folder: '',
                    template: ''
                },
                {
                    id: 'q2',
                    name: 'Q2',
                    format: 'YYYY-[Q2]',
                    months: [4, 5],
                    yearBasis: 'start',
                    useGroupSettings: true,
                    folder: '',
                    template: ''
                },
                {
                    id: 'q3',
                    name: 'Q3',
                    format: 'YYYY-[Q3]',
                    months: [6, 7, 8],
                    yearBasis: 'start',
                    useGroupSettings: true,
                    folder: '',
                    template: ''
                },
                {
                    id: 'q4',
                    name: 'Q4',
                    format: 'YYYY-[Q4]',
                    months: [9, 10],
                    yearBasis: 'start',
                    useGroupSettings: true,
                    folder: '',
                    template: ''
                },
                {
                    id: 'q5',
                    name: 'Q5',
                    format: 'YYYY-[Q5]',
                    months: [11, 12],
                    yearBasis: 'start',
                    useGroupSettings: true,
                    folder: '',
                    template: ''
                }
            ]
        }
    ]
};

export const DEFAULT_SETTINGS: LinearCalendarSettings = {
    currentYear: new Date().getFullYear(),
    dailyNoteFormat: 'YYYY-MM-DD',
    dailyNoteFolderMode: 'obsidian',
    dailyNoteCustomFolder: '',
    showDailyNotesInCells: false,  // Don't show daily notes as cells by default
    showNotesWithDateAndText: true,  // Show notes with date + text by default
    hideDateInTitle: false,  // Show full title by default
    calendarWidth: 'fit-screen',  // Fit to screen width by default
    cellMinWidth: 30,  // Minimum 30px per cell when scrollable
    columnAlignment: 'weekday',  // Align by weekday by default
    weekStartDay: 0,  // Sunday by default
    highlightedWeekdays: [0, 6],  // Saturday and Sunday by default
    showCellBorders: true,  // Show cell borders by default
    showWeekSpanBorders: false,  // No week span borders by default

    dateExtraction: {
        startFromProperties: ['date'],
        startFromFilename: false,
        startPriority: 'property',

        endFromProperties: [],
        endFromFilename: false,
        endPriority: 'property'
    },

    filterMode: 'none',
    filterConditions: [],

    colorCategories: {
        enabled: true,  // Enable colors by default
        categories: [],
        defaultCategoryColor: null,
        showCategoryIndex: true,
        showIconsInCalendar: true,
        colorPalettes: [
            {
                name: 'Default',
                colors: [
                    { name: 'Purple', hex: '#876c9d' },
                    { name: 'Blue', hex: '#6c849d' },
                    { name: 'Red', hex: '#9d6c6c' },
                    { name: 'Yellow', hex: '#9d906c' },
                    { name: 'Green', hex: '#779d6c' }
                ]
            }
        ]
    },

    quickNoteCreation: {
        enabled: true,
        showAddNoteButton: true,
        hasSeenWelcomeBanner: false,
        defaultFolder: 'dailynotes',
        customFolder: '',
        defaultStartDateProperty: 'date',
        defaultEndDateProperty: 'endDate',
        defaultCategoryProperty: 'category',
        defaultMetadata: [
            { key: 'category', value: '' }
        ]
    },

    periodicNotes: { ...DEFAULT_PERIODIC_NOTES },

    experimental: {
        multilineNotes: false,
        verticalText: false,
        compactFontSize: false,
        condensedLetters: false
    }
};

export const VIEW_TYPE_CALENDAR = "linear-calendar-view";
