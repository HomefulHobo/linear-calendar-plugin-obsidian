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

    // Simplified date extraction settings
    dateExtraction: DateExtractionConfig;

    // Optional filtering
    filterMode: 'none' | 'include' | 'exclude';
    filterConditions: Condition[];

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

    experimental: {
        multilineNotes: false,
        verticalText: false,
        compactFontSize: false,
        condensedLetters: false
    }
};

export const VIEW_TYPE_CALENDAR = "linear-calendar-view";
