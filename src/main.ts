import { Plugin } from 'obsidian';
import { LinearCalendarView } from './CalendarView';
import { CalendarSettingTab } from './SettingsTab';
import { LinearCalendarSettings, DEFAULT_SETTINGS, VIEW_TYPE_CALENDAR } from './types';

export default class LinearCalendarPlugin extends Plugin {
    settings!: LinearCalendarSettings;

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
