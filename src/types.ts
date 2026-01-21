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

    // Simplified date extraction settings
    dateExtraction: DateExtractionConfig;

    // Optional filtering
    filterMode: 'none' | 'include' | 'exclude';
    filterConditions: Condition[];

    // Color categories
    colorCategories: ColorCategoriesConfig;

    // Quick note creation
    quickNoteCreation: QuickNoteCreationConfig;

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

    experimental: {
        multilineNotes: false,
        verticalText: false,
        compactFontSize: false,
        condensedLetters: false
    }
};

export const VIEW_TYPE_CALENDAR = "linear-calendar-view";
