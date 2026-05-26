import { Plugin, TFile, MarkdownView, setIcon } from 'obsidian';
import { LinearCalendarView } from './CalendarView';
import { CalendarSettingTab } from './SettingsTab';
import { LinearCalendarSettings, DEFAULT_SETTINGS, VIEW_TYPE_CALENDAR } from './types';
import { rruleValueToReadable } from './recurringUtils';

export default class LinearCalendarPlugin extends Plugin {
    settings!: LinearCalendarSettings;
    isBratUser: boolean = false;

    // Plugin icon shown in settings sidebar, ribbon, and tabs
    icon = 'calendar-range';

    async onload(): Promise<void> {
        await this.loadSettings();
        this.isBratUser = await this.detectBratUser();

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

        this.addCommand({
            id: 'edit-recurring-rule',
            name: 'Edit recurring rule for current note',
            callback: async () => {
                const file = this.app.workspace.getActiveFile();
                if (file) this.openRecurringRuleBuilder(file);
            }
        });

        const { buildRecurringEditorExtension } = await import('./RecurringEventEditorExtension');
        this.registerEditorExtension(buildRecurringEditorExtension(this));

        // Inject edit buttons into the live-preview properties pane
        this.registerEvent(this.app.workspace.on('active-leaf-change', () => {
            setTimeout(() => this.injectRecurringButtonsToPropertiesPane(), 100);
        }));
        this.registerEvent(this.app.metadataCache.on('changed', () => {
            setTimeout(() => this.injectRecurringButtonsToPropertiesPane(), 100);
        }));

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
        this.cleanupRecurringInjections();

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
        migrated = this.migrateBannerSettings() || migrated;
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

    private async detectBratUser(): Promise<boolean> {
        try {
            const bratPath = `${this.app.vault.configDir}/plugins/obsidian42-brat/data.json`;
            const raw = await this.app.vault.adapter.read(bratPath);
            const data = JSON.parse(raw);
            return Array.isArray(data.pluginList) &&
                data.pluginList.includes('HomefulHobo/linear-calendar-plugin-obsidian');
        } catch {
            return false;
        }
    }

    /**
     * Migrate banner dismissed state from per-feature hasSeenWelcomeBanner flags
     * to the unified settings.banners object.
     */
    private migrateBannerSettings(): boolean {
        const raw = this.settings as any;
        let migrated = false;

        if ('hasSeenWelcomeBanner' in (raw.quickNoteCreation ?? {})) {
            this.settings.banners.quickNotes = raw.quickNoteCreation.hasSeenWelcomeBanner;
            delete raw.quickNoteCreation.hasSeenWelcomeBanner;
            migrated = true;
        }

        if ('hasSeenWelcomeBanner' in (raw.periodicNotes ?? {})) {
            this.settings.banners.periodicNotes = raw.periodicNotes.hasSeenWelcomeBanner;
            delete raw.periodicNotes.hasSeenWelcomeBanner;
            migrated = true;
        }

        return migrated;
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

    private cleanupRecurringInjections(): void {
        document.querySelectorAll('.lc-rrule-edit-btn-live, .lc-rrule-display').forEach(el => el.remove());
        document.querySelectorAll('.lc-rrule-value-hidden').forEach(el => {
            (el as HTMLElement).style.display = '';
            el.classList.remove('lc-rrule-value-hidden');
        });
    }

    injectRecurringButtonsToPropertiesPane(): void {
        // Always clean up stale injections first so this function is idempotent
        this.cleanupRecurringInjections();

        const config = this.settings.recurringEvents;
        if (!config.enabled || config.propertyRules.length === 0) return;

        // Only act on rrule-format rules — iso_date properties are handled natively by Obsidian
        const rruleRules = config.propertyRules.filter(r => (r.dateFormat ?? 'iso_date') === 'rrule');
        if (rruleRules.length === 0) return;

        const leaves = this.app.workspace.getLeavesOfType('markdown');
        for (const leaf of leaves) {
            const view = leaf.view;
            if (!(view instanceof MarkdownView)) continue;
            const file = view.file;
            if (!file) continue;

            const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
            if (!fm) continue;

            const propertiesEl = view.containerEl.querySelector('.metadata-properties');
            if (!propertiesEl) continue;

            for (const rule of rruleRules) {
                const rawVal = fm[rule.propertyName];
                if (rawVal === undefined || rawVal === null) continue;

                const propEl = propertiesEl.querySelector(`[data-property-key="${CSS.escape(rule.propertyName)}"]`);
                if (!propEl) continue;

                const valueStr = String(rawVal).trim();
                const readable = rruleValueToReadable(valueStr, 'rrule');

                // Replace raw value display with readable text + edit button (once)
                if (!propEl.querySelector('.lc-rrule-display')) {
                    // Hide the raw input / contenteditable
                    const rawInput = propEl.querySelector('.metadata-property-value .metadata-input-longtext, .metadata-property-value input') as HTMLElement | null;
                    if (rawInput) {
                        rawInput.style.display = 'none';
                        rawInput.classList.add('lc-rrule-value-hidden');
                    }

                    // Inject readable display with inline edit button
                    const valueWrapper = propEl.querySelector('.metadata-property-value');
                    if (valueWrapper) {
                        const display = document.createElement('div');
                        display.className = 'lc-rrule-display';
                        display.style.cssText = 'display: flex; align-items: center; gap: 4px;';

                        const text = document.createElement('span');
                        text.textContent = readable ?? valueStr;
                        text.style.fontSize = 'var(--metadata-input-font-size)';
                        display.appendChild(text);

                        const btn = document.createElement('button');
                        btn.className = 'lc-rrule-edit-btn-live';
                        btn.setAttribute('aria-label', 'Edit recurring rule');
                        btn.style.cssText = 'cursor: pointer; opacity: var(--icon-opacity); color: var(--icon-color); background: none; border: none; outline: none; padding: 0; margin: 0; display: inline-flex; align-items: center; flex-shrink: 0; box-shadow: none;';
                        setIcon(btn, 'square-pen');
                        const svg = btn.querySelector('svg');
                        if (svg) svg.style.cssText = 'width: var(--icon-xs); height: var(--icon-xs);';
                        btn.addEventListener('mouseenter', () => btn.style.opacity = 'var(--icon-opacity-hover)');
                        btn.addEventListener('mouseleave', () => btn.style.opacity = 'var(--icon-opacity)');
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.openRecurringRuleBuilder(file);
                        });
                        display.appendChild(btn);

                        valueWrapper.appendChild(display);
                    }
                }
            }
        }
    }

    async openRecurringRuleBuilder(file: TFile): Promise<void> {
        const { RecurringRuleBuilderModal } = await import('./SettingsTab');
        new RecurringRuleBuilderModal(this.app, this, file).open();
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

        // Re-inject recurring property displays so pen/readable-text reflects new settings
        this.cleanupRecurringInjections();
        setTimeout(() => this.injectRecurringButtonsToPropertiesPane(), 50);
    }
}
