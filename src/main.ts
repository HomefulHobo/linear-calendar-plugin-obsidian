import { Plugin } from 'obsidian';
import { LinearCalendarView } from './CalendarView';
import { CalendarSettingTab } from './SettingsTab';
import { LinearCalendarSettings, DEFAULT_SETTINGS, VIEW_TYPE_CALENDAR } from './types';

export default class LinearCalendarPlugin extends Plugin {
    settings: LinearCalendarSettings;

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
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_CALENDAR);
    }

    async loadSettings(): Promise<void> {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
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
