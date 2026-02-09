import { Plugin } from 'obsidian';
import { LinearCalendarView } from './CalendarView';
import { CalendarSettingTab } from './SettingsTab';
import { LinearCalendarSettings, DEFAULT_SETTINGS, VIEW_TYPE_CALENDAR } from './types';

export default class LinearCalendarPlugin extends Plugin {
    settings!: LinearCalendarSettings;

    // Plugin icon shown in settings sidebar, ribbon, and tabs
    icon = 'calendar-range';

    async onload(): Promise<void> {
        await this.loadSettings();

        this.registerView(
            VIEW_TYPE_CALENDAR,
            (leaf) => new LinearCalendarView(leaf, this)
        );

        this.addRibbonIcon('calendar-range', 'Open Linear Calendar', () => {
            this.activateView();
        });

        this.addCommand({
            id: 'open-linear-calendar',
            name: 'Open Linear Calendar',
            callback: () => {
                this.activateView();
            }
        });

        this.addCommand({
            id: 'quick-note-create',
            name: 'Create Quick Note',
            callback: async () => {
                const { QuickNoteModal } = await import('./QuickNoteModal');
                new QuickNoteModal(this.app, this, null, null).open();
            }
        });

        this.addSettingTab(new CalendarSettingTab(this.app, this));
    }

    async activateView(): Promise<void> {
        const { workspace } = this.app;

        let leaf = null;
        const leaves = workspace.getLeavesOfType(VIEW_TYPE_CALENDAR);

        if (leaves.length > 0) {
            leaf = leaves[0];
        } else {
            leaf = workspace.getLeaf(false);
            await leaf.setViewState({ type: VIEW_TYPE_CALENDAR, active: true });
        }

        workspace.revealLeaf(leaf);
    }

    onunload(): void {
        // Clean up mouse handlers
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR);
        for (const leaf of leaves) {
            if (leaf.view instanceof LinearCalendarView) {
                const view = leaf.view as LinearCalendarView;
                if (view.mouseUpHandler) {
                    document.removeEventListener('mouseup', view.mouseUpHandler);
                }
            }
        }

        this.app.workspace.detachLeavesOfType(VIEW_TYPE_CALENDAR);
    }

    async loadSettings(): Promise<void> {
        const loadedData = await this.loadData();

        // Deep merge to preserve user settings while adding new defaults
        this.settings = this.deepMerge(DEFAULT_SETTINGS, loadedData || {});

        // Run migrations
        let migrated = false;
        migrated = this.migrateQuinterExample() || migrated;

        // Save if any migration occurred
        if (migrated) {
            await this.saveData(this.settings);
        }
    }

    /**
     * Deep merge two objects, preserving user values while adding new defaults.
     * Handles nested objects but not arrays (arrays are replaced, not merged).
     */
    private deepMerge<T>(defaults: T, loaded: Partial<T>): T {
        const result: any = Object.assign({}, defaults);

        for (const key in loaded) {
            const loadedValue = loaded[key];
            const defaultValue = (defaults as any)[key];

            // If both are plain objects (not arrays, not null), deep merge them
            if (this.isPlainObject(loadedValue) && this.isPlainObject(defaultValue)) {
                result[key] = this.deepMerge(defaultValue, loadedValue as any);
            } else {
                // For primitives, arrays, or when only one side is an object, use loaded value
                result[key] = loadedValue;
            }
        }

        return result as T;
    }

    /**
     * Check if a value is a plain object (not an array, not null, not a Date, etc.)
     */
    private isPlainObject(value: any): boolean {
        return value !== null &&
               typeof value === 'object' &&
               !Array.isArray(value) &&
               Object.prototype.toString.call(value) === '[object Object]';
    }

    /**
     * Migrate Quinter example from v0.4.0 with incorrect months, names, and formats.
     * Returns true if migration was performed.
     */
    private migrateQuinterExample(): boolean {
        const quintersGroup = this.settings.periodicNotes.customPeriodGroups.find(
            group => group.id === 'quinter-example'
        );

        if (!quintersGroup) {
            return false;
        }

        // Define the old incorrect configurations from v0.4.0 (Q1-Q5 with wrong months)
        const oldConfigs = {
            'q1': { months: [1, 2, 3], name: 'Q1', format: 'YYYY-[Q1]' },
            'q2': { months: [4, 5], name: 'Q2', format: 'YYYY-[Q2]' },
            'q3': { months: [6, 7, 8], name: 'Q3', format: 'YYYY-[Q3]' },
            'q4': { months: [9, 10], name: 'Q4', format: 'YYYY-[Q4]' },
            'q5': { months: [11, 12], name: 'Q5', format: 'YYYY-[Q5]' }
        };

        // Define the correct configurations (A-E with correct months)
        const correctConfigs = {
            'q1': { id: 'a', months: [1, 2], name: 'A', format: 'YYYY-[A]' },
            'q2': { id: 'b', months: [3, 4, 5], name: 'B', format: 'YYYY-[B]' },
            'q3': { id: 'c', months: [6, 7, 8], name: 'C', format: 'YYYY-[C]' },
            'q4': { id: 'd', months: [9, 10, 11], name: 'D', format: 'YYYY-[D]' },
            'q5': { id: 'e', months: [12], name: 'E', format: 'YYYY-[E]' }
        };

        let needsMigration = false;

        // Check if this group has the old incorrect configuration
        for (const period of quintersGroup.periods) {
            const oldConfig = oldConfigs[period.id as keyof typeof oldConfigs];
            if (oldConfig && this.arraysEqual(period.months, oldConfig.months)) {
                needsMigration = true;
                break;
            }
        }

        // If migration needed, update all periods to correct configuration
        if (needsMigration) {
            for (const period of quintersGroup.periods) {
                const correctConfig = correctConfigs[period.id as keyof typeof correctConfigs];
                if (correctConfig) {
                    period.id = correctConfig.id;
                    period.name = correctConfig.name;
                    period.format = correctConfig.format;
                    period.months = correctConfig.months;
                }
            }
            return true;
        }

        return false;
    }

    /**
     * Helper to compare two arrays for equality
     */
    private arraysEqual(a: number[], b: number[]): boolean {
        return a.length === b.length && a.every((val, index) => val === b[index]);
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);

        // Reload calendar view if it's open
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR);
        for (const leaf of leaves) {
            if (leaf.view instanceof LinearCalendarView) {
                await (leaf.view as LinearCalendarView).reload();
            }
        }
    }
}
