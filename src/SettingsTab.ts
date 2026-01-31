import { App, PluginSettingTab, Setting, setIcon, Modal } from 'obsidian';
import LinearCalendarPlugin from './main';
import { Condition, ColorCategory, CustomPeriod, CustomPeriodGroup } from './types';
import { FolderSuggest } from './FolderSuggest';
import { FileSuggest } from './FileSuggest';
import { IconSuggest } from './IconSuggest';
import { PropertySuggest } from './PropertySuggest';
import { ConditionRenderer } from './helpers/ConditionRenderer';
import { MetadataRowRenderer } from './helpers/MetadataRowRenderer';
import { ColorPickerRenderer } from './helpers/ColorPickerRenderer';
import { LinearCalendarView } from './CalendarView';

export class CalendarSettingTab extends PluginSettingTab {
    plugin: LinearCalendarPlugin;
    private expandedCategories: Set<string> = new Set();
    private isPalettesExpanded: boolean = false;
    private paletteEditModes: Map<number, 'visual' | 'source'> = new Map();
    private activeTab: 'basic' | 'categories' | 'daily-notes' | 'periodic-notes' | 'quicknotes' | 'experimental' = 'basic';

    // Icon displayed in the settings sidebar
    icon = 'calendar-range';

    constructor(app: App, plugin: LinearCalendarPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    /**
     * Create a checkbox with label that only toggles when the checkbox itself is clicked.
     * This prevents accidental toggling when clicking the label text.
     */
    private createCheckboxWithLabel(
        container: HTMLElement,
        text: string,
        checked: boolean,
        onChange: (checked: boolean) => void | Promise<void>
    ): HTMLInputElement {
        const wrapper = container.createDiv();
        wrapper.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 8px;';

        const checkbox = wrapper.createEl('input', { type: 'checkbox' });
        checkbox.checked = checked;
        checkbox.onchange = async (e) => {
            await onChange((e.target as HTMLInputElement).checked);
        };

        const label = wrapper.createEl('span', { text });
        label.style.cssText = 'font-weight: 500; cursor: default;';

        return checkbox;
    }

    /**
     * Get the template folder path based on settings.
     * Returns the Obsidian templates folder or the custom folder.
     */
    getTemplateFolderPath(): string | undefined {
        const settings = this.plugin.settings.periodicNotes;

        if (settings.templateFolderSource === 'custom') {
            return settings.templateCustomFolder || undefined;
        }

        // Try to get Obsidian's templates folder from core plugin
        const templatesPlugin = (this.app as any).internalPlugins?.plugins?.['templates'];
        if (templatesPlugin?.enabled && templatesPlugin?.instance?.options?.folder) {
            return templatesPlugin.instance.options.folder;
        }

        // Try Templater plugin as fallback
        const templaterPlugin = (this.app as any).plugins?.plugins?.['templater-obsidian'];
        if (templaterPlugin?.settings?.templates_folder) {
            return templaterPlugin.settings.templates_folder;
        }

        return undefined;
    }

    /**
     * IMPORTANT: This helper method is used in multiple places (Categories settings AND CategoryEditModal).
     * When making changes to this method, always evaluate if the change should apply to both locations.
     * Current usage locations:
     * 1. Categories section - within each category's collapsible content (line ~1618)
     * 2. CategoryEditModal conditions section (line ~2461)
     */
    renderConditionsInfoIcon(container: HTMLElement): void {
        const infoIcon = container.createEl('span');
        setIcon(infoIcon, 'info');
        infoIcon.style.cssText = 'cursor: pointer; color: var(--text-muted); display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px;';
        infoIcon.title = 'Click to see examples';

        // Create popover (hidden by default)
        let popover: HTMLElement | null = null;

        const closePopover = () => {
            if (popover) {
                popover.remove();
                popover = null;
            }
        };

        infoIcon.onclick = (e) => {
            e.preventDefault();

            // Close existing popover if open
            if (popover) {
                closePopover();
                return;
            }

            // Create popover
            popover = document.body.createDiv();
            popover.style.cssText = 'position: fixed; z-index: 1000; background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 6px; padding: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3); max-width: 280px;';

            // Close button
            const closeBtn = popover.createEl('button');
            closeBtn.textContent = '×';
            closeBtn.style.cssText = 'position: absolute; top: 4px; right: 4px; width: 24px; height: 24px; border: none; background: transparent; cursor: pointer; font-size: 1.4em; line-height: 1; padding: 0; color: var(--text-muted); border-radius: 3px;';
            closeBtn.title = 'Close';
            closeBtn.onmouseenter = () => {
                closeBtn.style.background = 'var(--background-modifier-hover)';
            };
            closeBtn.onmouseleave = () => {
                closeBtn.style.background = 'transparent';
            };
            closeBtn.onclick = (e) => {
                e.preventDefault();
                closePopover();
            };

            // Examples heading
            popover.createEl('div', {
                text: 'Examples:',
                attr: { style: 'font-weight: 600; margin-bottom: 8px; color: var(--text-normal); padding-right: 20px;' }
            });

            // Example items
            popover.createEl('div', {
                text: '• Property "category" is "school"',
                attr: { style: 'margin-left: 8px; color: var(--text-muted); margin-bottom: 4px; font-size: 0.9em;' }
            });
            popover.createEl('div', {
                text: '• File tags has tag "holidays"',
                attr: { style: 'margin-left: 8px; color: var(--text-muted); margin-bottom: 4px; font-size: 0.9em;' }
            });
            popover.createEl('div', {
                text: '• File name contains "meeting"',
                attr: { style: 'margin-left: 8px; color: var(--text-muted); font-size: 0.9em;' }
            });

            // Position near icon
            const iconRect = infoIcon.getBoundingClientRect();
            popover.style.top = (iconRect.bottom + 6) + 'px';
            popover.style.left = iconRect.left + 'px';

            // Adjust if off-screen
            setTimeout(() => {
                if (popover) {
                    const popoverRect = popover.getBoundingClientRect();
                    if (popoverRect.right > window.innerWidth) {
                        popover.style.left = (window.innerWidth - popoverRect.width - 10) + 'px';
                    }
                    if (popoverRect.bottom > window.innerHeight) {
                        popover.style.top = (iconRect.top - popoverRect.height - 6) + 'px';
                    }
                }
            }, 0);

            // Close on click outside
            const closeHandler = (e: MouseEvent) => {
                if (popover && !popover.contains(e.target as Node) && !infoIcon.contains(e.target as Node)) {
                    closePopover();
                    document.removeEventListener('click', closeHandler);
                }
            };

            setTimeout(() => {
                document.addEventListener('click', closeHandler);
            }, 0);

            // Close on Escape key
            const escHandler = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    closePopover();
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
        };
    }

    display(): void {
        const { containerEl } = this;

        // Save scroll position before clearing
        const scrollTop = containerEl.scrollTop;

        containerEl.empty();

        containerEl.createEl('h2', { text: 'Linear Calendar Settings' });

        // Development notice (always visible)
        this.renderDevelopmentNotice(containerEl);

        // Render tabs
        this.renderTabs(containerEl);

        // Content container for the active tab
        const contentEl = containerEl.createDiv();
        contentEl.style.cssText = 'margin-top: 20px;';

        // Render content based on active tab
        if (this.activeTab === 'basic') {
            this.renderCalendarAppearanceSection(contentEl);
            this.renderDivider(contentEl);
            this.renderDateExtractionSection(contentEl);
            this.renderDivider(contentEl);
            this.renderFiltersSection(contentEl);
        } else if (this.activeTab === 'categories') {
            this.renderColorCategoriesSection(contentEl);
        } else if (this.activeTab === 'daily-notes') {
            this.renderDailyNotesSection(contentEl);
        } else if (this.activeTab === 'periodic-notes') {
            this.renderPeriodicNotesSection(contentEl);
        } else if (this.activeTab === 'quicknotes') {
            this.renderQuickNoteCreationSettings(contentEl);
        } else if (this.activeTab === 'experimental') {
            this.renderExperimentalSection(contentEl);
        }

        // Restore scroll position after render
        setTimeout(() => {
            containerEl.scrollTop = scrollTop;
        }, 0);
    }

    renderTabs(containerEl: HTMLElement): void {
        const tabsContainer = containerEl.createDiv();
        tabsContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px; border-bottom: 2px solid var(--background-modifier-border); margin-top: 20px; padding-bottom: 8px;';

        const tabs = [
            { id: 'basic' as const, label: 'Basic Settings' },
            { id: 'categories' as const, label: 'Categories (Colors & Icons)' },
            { id: 'daily-notes' as const, label: 'Daily Notes' },
            { id: 'periodic-notes' as const, label: 'Periodic Notes' },
            { id: 'quicknotes' as const, label: 'Quick Notes' },
            { id: 'experimental' as const, label: 'Experimental' }
        ];

        tabs.forEach(tab => {
            const tabBtn = tabsContainer.createEl('button');
            const isActive = this.activeTab === tab.id;

            tabBtn.textContent = tab.label;
            tabBtn.style.cssText = `
                padding: 10px 16px;
                background: ${isActive ? 'var(--background-primary)' : 'var(--background-secondary)'};
                border: none;
                border-bottom: 2px solid ${isActive ? 'var(--interactive-accent)' : 'transparent'};
                cursor: pointer;
                font-size: 0.95em;
                font-weight: ${isActive ? '600' : '400'};
                color: ${isActive ? 'var(--text-normal)' : 'var(--text-muted)'};
                transition: all 0.2s;
                margin-bottom: -2px;
            `;

            tabBtn.addEventListener('click', () => {
                this.activeTab = tab.id;
                this.display();
            });

            tabBtn.addEventListener('mouseenter', () => {
                if (!isActive) {
                    tabBtn.style.background = 'var(--background-modifier-hover)';
                    tabBtn.style.color = 'var(--text-normal)';
                }
            });

            tabBtn.addEventListener('mouseleave', () => {
                if (!isActive) {
                    tabBtn.style.background = 'var(--background-secondary)';
                    tabBtn.style.color = 'var(--text-muted)';
                }
            });
        });
    }

    renderDevelopmentNotice(containerEl: HTMLElement): void {
        const noticeEl = containerEl.createDiv();
        noticeEl.style.cssText = 'background: var(--background-secondary); border-left: 4px solid var(--interactive-accent); padding: 15px 20px; margin: 15px 0 12px 0; border-radius: 3px;';

        const titleEl = noticeEl.createEl('div');
        titleEl.style.cssText = 'font-weight: 600; margin-bottom: 8px; color: var(--text-normal);';
        titleEl.textContent = '⚠️ Early Development';

        const textEl = noticeEl.createEl('div');
        textEl.style.cssText = 'font-size: 0.95em; line-height: 1.5; color: var(--text-muted);';
        textEl.innerHTML = `
            This plugin is in early development and may undergo significant changes. The core functionality—how notes are recognized and dates are extracted—will remain stable. If you use properties or dates in filenames, these will continue to work.<br><br>
            New features are actively being developed. If you encounter any issues or have feedback, please reach out via <a href="https://github.com/HomefulHobo/linear-calendar-plugin-obsidian/" style="color: var(--interactive-accent);">GitHub</a> or via <a href="https://www.homefulhobo.com/contact/" style="color: var(--interactive-accent);">e-mail</a>.
        `;

        // Feedback box
        const feedbackBox = containerEl.createDiv();
        feedbackBox.style.cssText = 'background: var(--background-primary); border: 2px solid var(--interactive-accent); padding: 15px 20px; margin: 0 0 20px 0; border-radius: 6px;';

        const feedbackTitle = feedbackBox.createEl('div');
        feedbackTitle.style.cssText = 'font-weight: 600; margin-bottom: 10px; color: var(--interactive-accent); font-size: 1.05em;';
        feedbackTitle.textContent = '💬 Feedback wanted – Version 0.4.0';

        const feedbackList = feedbackBox.createEl('ul');
        feedbackList.style.cssText = 'margin: 8px 0 10px 0; padding-left: 20px; color: var(--text-normal); font-size: 0.95em; line-height: 1.6;';
        feedbackList.innerHTML = `
            <li>Do the periodic notes work and behave as expected?</li>
            <li>Do you like the new look?</li>
            <li>Is it clear how to edit the calendar's look?</li>
            <li>Did switching from an older version to the new one go smoothly?</li>
            <li>Is there anything weird, annoying, unexpected happening?</li>
            <li>Is anything hard to understand or unclear how to configure?</li>
        `;

        const olderVersionsPara = feedbackBox.createEl('p');
        olderVersionsPara.style.cssText = 'margin: 12px 0 4px 0; color: var(--text-normal); font-size: 0.95em; font-weight: 500;';
        olderVersionsPara.textContent = 'Older versions:';

        const olderVersionsList = feedbackBox.createEl('ul');
        olderVersionsList.style.cssText = 'margin: 4px 0 10px 0; padding-left: 20px; color: var(--text-normal); font-size: 0.95em; line-height: 1.6;';
        olderVersionsList.innerHTML = `
            <li>Does the QuickAdd feature work as you would like?</li>
            <li>Are the color categories working as you would like?</li>
        `;

        const feedbackFooter = feedbackBox.createEl('div');
        feedbackFooter.style.cssText = 'font-size: 0.95em; color: var(--text-muted); margin-top: 8px;';

        const footerText = feedbackFooter.createEl('div');
        footerText.style.cssText = 'font-style: italic; margin-bottom: 6px;';
        footerText.textContent = 'Help me improve the plugin! It means a lot to me ✨🦈';

        const footerLinks = feedbackFooter.createEl('div');
        footerLinks.style.cssText = 'font-size: 0.9em;';
        footerLinks.innerHTML = `
            Share feedback via <a href="https://github.com/HomefulHobo/linear-calendar-plugin-obsidian/" style="color: var(--interactive-accent);">GitHub</a> or <a href="https://www.homefulhobo.com/contact/" style="color: var(--interactive-accent);">e-mail</a>.
        `;
    }

    renderDivider(containerEl: HTMLElement): void {
        const divider = containerEl.createEl('hr');
        divider.style.cssText = 'margin: 30px 0; border: none; border-top: 1px solid var(--background-modifier-border);';
    }

    renderCalendarAppearanceSection(containerEl: HTMLElement): void {
        containerEl.createEl('h3', { text: 'Calendar Appearance' });

        new Setting(containerEl)
            .setName('Calendar width')
            .setDesc('Choose whether the calendar fits the screen width or becomes scrollable with wider cells')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('fit-screen', 'Fit to screen width')
                    .addOption('scrollable', 'Scrollable (wider cells)')
                    .setValue(this.plugin.settings.calendarWidth)
                    .onChange(async (value) => {
                        this.plugin.settings.calendarWidth = value as 'fit-screen' | 'scrollable';
                        await this.plugin.saveSettings();
                        this.display();
                    });
            });

        if (this.plugin.settings.calendarWidth === 'scrollable') {
            new Setting(containerEl)
                .setName('Minimum cell width')
                .setDesc('Minimum width for each day cell in pixels (default: 30)')
                .addText(text => text
                    .setPlaceholder('30')
                    .setValue(String(this.plugin.settings.cellMinWidth))
                    .onChange(async (value) => {
                        const numValue = parseInt(value);
                        if (!isNaN(numValue) && numValue >= 20 && numValue <= 200) {
                            this.plugin.settings.cellMinWidth = numValue;
                            await this.plugin.saveSettings();
                        }
                    }));
        }

        new Setting(containerEl)
            .setName('Column alignment')
            .setDesc('Choose how to align the calendar columns: by weekday or by date (all 1st days align, all 2nd days align, etc.)')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('weekday', 'Align by weekday')
                    .addOption('date', 'Align by date')
                    .setValue(this.plugin.settings.columnAlignment)
                    .onChange(async (value) => {
                        this.plugin.settings.columnAlignment = value as 'weekday' | 'date';
                        await this.plugin.saveSettings();
                        this.display();  // Refresh to show/hide week start setting
                    });
            });

        // Week start day setting (only shown in weekday mode)
        if (this.plugin.settings.columnAlignment === 'weekday') {
            new Setting(containerEl)
                .setName('Week starts on')
                .setDesc('Choose which day the week starts on')
                .addDropdown(dropdown => {
                    dropdown
                        .addOption('0', 'Sunday')
                        .addOption('1', 'Monday')
                        .addOption('2', 'Tuesday')
                        .addOption('3', 'Wednesday')
                        .addOption('4', 'Thursday')
                        .addOption('5', 'Friday')
                        .addOption('6', 'Saturday')
                        .setValue(String(this.plugin.settings.weekStartDay))
                        .onChange(async (value) => {
                            this.plugin.settings.weekStartDay = parseInt(value);
                            await this.plugin.saveSettings();
                        });
                });
        }

        // Highlighted weekdays setting
        const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const highlightedSetting = new Setting(containerEl)
            .setName('Highlighted weekdays')
            .setDesc('Choose which weekdays to visually highlight (typically weekends)');

        const checkboxContainer = highlightedSetting.controlEl.createDiv();
        checkboxContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px;';

        weekdayNames.forEach((name, index) => {
            const label = checkboxContainer.createEl('label');
            label.style.cssText = 'display: flex; align-items: center; gap: 4px; cursor: pointer; font-size: 0.9em;';

            const checkbox = label.createEl('input', { type: 'checkbox' });
            checkbox.checked = this.plugin.settings.highlightedWeekdays.includes(index);
            checkbox.onchange = async () => {
                const current = this.plugin.settings.highlightedWeekdays;
                if (checkbox.checked) {
                    if (!current.includes(index)) {
                        current.push(index);
                        current.sort((a, b) => a - b);
                    }
                } else {
                    const idx = current.indexOf(index);
                    if (idx > -1) current.splice(idx, 1);
                }
                await this.plugin.saveSettings();
            };

            label.createEl('span', { text: name.slice(0, 3) });
        });

        // Cell borders toggle
        new Setting(containerEl)
            .setName('Show cell borders')
            .setDesc('Display thin borders around day cells and week span cells')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showCellBorders)
                .onChange(async (value) => {
                    this.plugin.settings.showCellBorders = value;
                    await this.plugin.saveSettings();
                }));
    }

    renderDateExtractionSection(containerEl: HTMLElement): void {
        containerEl.createEl('h3', { text: 'Date Extraction' });

        const desc = containerEl.createEl('p', {
            cls: 'setting-item-description',
            text: 'Configure how dates are extracted from your notes to display them in the calendar.'
        });
        desc.style.marginTop = '-10px';
        desc.style.marginBottom = '15px';

        // Add examples box
        const examplesBox = containerEl.createDiv();
        examplesBox.style.cssText = 'background: var(--background-primary); border-left: 3px solid var(--interactive-accent); padding: 12px 15px; margin-bottom: 20px; border-radius: 3px;';

        examplesBox.createEl('div', {
            text: '💡 Example Configurations',
            attr: { style: 'font-weight: 600; margin-bottom: 8px; color: var(--interactive-accent);' }
        });

        const examplesList = examplesBox.createEl('ul');
        examplesList.style.cssText = 'margin: 0; padding-left: 20px; font-size: 0.9em; line-height: 1.6;';

        const examples = [
            'Use <code>date</code> and <code>date_end</code> properties',
            'Use filename like <code>2024-01-15 – 2024-01-20 Event.md</code> for date ranges',
            'Mix sources: filename for start date + <code>date_end</code> property for end date',
            'Add multiple property names to check (e.g., <code>date</code>, <code>lincal_date</code>, <code>scheduled</code>)'
        ];

        examples.forEach(example => {
            const li = examplesList.createEl('li');
            li.innerHTML = example;
            li.style.marginBottom = '4px';
        });

        const config = this.plugin.settings.dateExtraction;

        // START DATE section
        const startSection = containerEl.createDiv();
        startSection.style.cssText = 'background: var(--background-secondary); padding: 15px; border-radius: 5px; margin-bottom: 20px;';

        startSection.createEl('h4', { text: 'Start Date', attr: { style: 'margin-top: 0;' } });

        // Start from properties
        const startPropsContainer = startSection.createDiv();
        startPropsContainer.style.cssText = 'margin-bottom: 15px;';

        // Checkbox first
        const startPropsListContainer = document.createElement('div');
        startPropsListContainer.style.cssText = 'margin-left: 28px;';
        if (config.startFromProperties.length === 0) {
            startPropsListContainer.style.display = 'none';
        }

        this.createCheckboxWithLabel(
            startPropsContainer,
            'From properties',
            config.startFromProperties.length > 0,
            async (checked) => {
                if (checked) {
                    if (config.startFromProperties.length === 0) {
                        config.startFromProperties.push('date');
                    }
                    startPropsListContainer.style.display = 'block';
                } else {
                    config.startFromProperties = [];
                    startPropsListContainer.style.display = 'none';
                }
                await this.plugin.saveSettings();
                renderStartPropsList();
            }
        );

        // Properties list container appended after checkbox
        startPropsContainer.appendChild(startPropsListContainer);

        const renderStartPropsList = () => {
            startPropsListContainer.empty();

            // Add hint text if multiple properties
            if (config.startFromProperties.length > 0) {
                startPropsListContainer.createEl('div', {
                    text: 'Properties are checked in order from top to bottom. Drag to reorder.',
                    attr: { style: 'font-size: 0.85em; color: var(--text-muted); margin-bottom: 8px; font-style: italic;' }
                });
            }

            let draggedIndex: number | null = null;

            config.startFromProperties.forEach((prop, index) => {
                const propRow = startPropsListContainer.createDiv();
                propRow.style.cssText = 'display: flex; gap: 5px; margin-bottom: 5px; align-items: center; cursor: grab;';
                propRow.draggable = true;
                propRow.setAttribute('data-index', index.toString());

                // Drag handle
                const dragHandle = propRow.createEl('span', { text: '⋮⋮' });
                dragHandle.style.cssText = 'cursor: grab; color: var(--text-muted); user-select: none; padding: 0 4px;';

                const propInput = propRow.createEl('input', {
                    type: 'text',
                    value: prop,
                    attr: { placeholder: 'Property name' }
                });
                propInput.style.cssText = 'flex: 1; padding: 4px 8px;';
                propInput.onchange = async (e) => {
                    config.startFromProperties[index] = (e.target as HTMLInputElement).value;
                    await this.plugin.saveSettings();
                };

                // Add property suggestions
                new PropertySuggest(this.app, propInput);

                const removeBtn = propRow.createEl('button', { text: '×' });
                removeBtn.style.cssText = 'padding: 2px 8px; cursor: pointer;';
                removeBtn.onclick = async () => {
                    config.startFromProperties.splice(index, 1);
                    await this.plugin.saveSettings();
                    renderStartPropsList();
                };

                // Drag events
                propRow.addEventListener('dragstart', () => {
                    draggedIndex = index;
                    propRow.style.opacity = '0.4';
                    propRow.style.cursor = 'grabbing';
                });

                propRow.addEventListener('dragend', () => {
                    propRow.style.opacity = '1';
                    propRow.style.cursor = 'grab';
                });

                propRow.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    if (draggedIndex !== null && draggedIndex !== index) {
                        propRow.style.borderTop = '2px solid var(--interactive-accent)';
                    }
                });

                propRow.addEventListener('dragleave', () => {
                    propRow.style.borderTop = '';
                });

                propRow.addEventListener('drop', async (e) => {
                    e.preventDefault();
                    propRow.style.borderTop = '';

                    if (draggedIndex !== null && draggedIndex !== index) {
                        const draggedItem = config.startFromProperties[draggedIndex];
                        config.startFromProperties.splice(draggedIndex, 1);

                        // Adjust index if needed
                        const newIndex = draggedIndex < index ? index - 1 : index;
                        config.startFromProperties.splice(newIndex, 0, draggedItem);

                        await this.plugin.saveSettings();
                        renderStartPropsList();
                    }
                    draggedIndex = null;
                });
            });

            const addBtn = startPropsListContainer.createEl('button', { text: '+ Add property' });
            addBtn.style.cssText = 'padding: 4px 8px; margin-top: 5px;';
            addBtn.onclick = async () => {
                config.startFromProperties.push('');
                await this.plugin.saveSettings();
                renderStartPropsList();
            };
        };

        renderStartPropsList();

        // Start from filename
        this.createCheckboxWithLabel(
            startSection,
            'From filename (first YYYY-MM-DD pattern)',
            config.startFromFilename,
            async (checked) => {
                config.startFromFilename = checked;
                await this.plugin.saveSettings();
                updatePriorityVisibility();
            }
        );

        // Priority selection (only show if both are enabled)
        const startPriorityContainer = startSection.createDiv();
        startPriorityContainer.style.cssText = 'margin-top: 10px; padding: 10px; background: var(--background-primary); border-radius: 3px;';

        const updatePriorityVisibility = () => {
            const bothEnabled = config.startFromProperties.length > 0 && config.startFromFilename;
            startPriorityContainer.style.display = bothEnabled ? 'block' : 'none';
        };

        startPriorityContainer.createEl('div', {
            text: 'When both are available, prioritize:',
            attr: { style: 'margin-bottom: 8px; font-size: 0.9em; color: var(--text-muted);' }
        });

        const priorityOptions = startPriorityContainer.createDiv();
        priorityOptions.style.cssText = 'display: flex; gap: 15px;';

        const propRadioLabel = priorityOptions.createEl('label');
        propRadioLabel.style.cssText = 'display: flex; align-items: center; gap: 5px;';
        const propRadio = propRadioLabel.createEl('input', { type: 'radio', attr: { name: 'start-priority' } });
        propRadio.checked = config.startPriority === 'property';
        propRadioLabel.createEl('span', { text: 'Property' });
        propRadio.onchange = async () => {
            config.startPriority = 'property';
            await this.plugin.saveSettings();
        };

        const filenameRadioLabel = priorityOptions.createEl('label');
        filenameRadioLabel.style.cssText = 'display: flex; align-items: center; gap: 5px;';
        const filenameRadio = filenameRadioLabel.createEl('input', { type: 'radio', attr: { name: 'start-priority' } });
        filenameRadio.checked = config.startPriority === 'filename';
        filenameRadioLabel.createEl('span', { text: 'Filename' });
        filenameRadio.onchange = async () => {
            config.startPriority = 'filename';
            await this.plugin.saveSettings();
        };

        updatePriorityVisibility();

        // END DATE section
        const endSection = containerEl.createDiv();
        endSection.style.cssText = 'background: var(--background-secondary); padding: 15px; border-radius: 5px;';

        endSection.createEl('h4', { text: 'End Date (for multi-day events)', attr: { style: 'margin-top: 0;' } });

        // End from properties
        const endPropsContainer = endSection.createDiv();
        endPropsContainer.style.cssText = 'margin-bottom: 15px;';

        // Properties list container (will be appended after checkbox)
        const endPropsListContainer = document.createElement('div');
        endPropsListContainer.style.cssText = 'margin-left: 28px;';
        if (config.endFromProperties.length === 0) {
            endPropsListContainer.style.display = 'none';
        }

        const renderEndPropsList = () => {
            endPropsListContainer.empty();

            // Add hint text if multiple properties
            if (config.endFromProperties.length > 0) {
                endPropsListContainer.createEl('div', {
                    text: 'Properties are checked in order from top to bottom. Drag to reorder.',
                    attr: { style: 'font-size: 0.85em; color: var(--text-muted); margin-bottom: 8px; font-style: italic;' }
                });
            }

            let draggedIndex: number | null = null;

            config.endFromProperties.forEach((prop, index) => {
                const propRow = endPropsListContainer.createDiv();
                propRow.style.cssText = 'display: flex; gap: 5px; margin-bottom: 5px; align-items: center; cursor: grab;';
                propRow.draggable = true;
                propRow.setAttribute('data-index', index.toString());

                // Drag handle
                const dragHandle = propRow.createEl('span', { text: '⋮⋮' });
                dragHandle.style.cssText = 'cursor: grab; color: var(--text-muted); user-select: none; padding: 0 4px;';

                const propInput = propRow.createEl('input', {
                    type: 'text',
                    value: prop,
                    attr: { placeholder: 'Property name' }
                });
                propInput.style.cssText = 'flex: 1; padding: 4px 8px;';
                propInput.onchange = async (e) => {
                    config.endFromProperties[index] = (e.target as HTMLInputElement).value;
                    await this.plugin.saveSettings();
                };

                // Add property suggestions
                new PropertySuggest(this.app, propInput);

                const removeBtn = propRow.createEl('button', { text: '×' });
                removeBtn.style.cssText = 'padding: 2px 8px; cursor: pointer;';
                removeBtn.onclick = async () => {
                    config.endFromProperties.splice(index, 1);
                    await this.plugin.saveSettings();
                    renderEndPropsList();
                };

                // Drag events
                propRow.addEventListener('dragstart', () => {
                    draggedIndex = index;
                    propRow.style.opacity = '0.4';
                    propRow.style.cursor = 'grabbing';
                });

                propRow.addEventListener('dragend', () => {
                    propRow.style.opacity = '1';
                    propRow.style.cursor = 'grab';
                });

                propRow.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    if (draggedIndex !== null && draggedIndex !== index) {
                        propRow.style.borderTop = '2px solid var(--interactive-accent)';
                    }
                });

                propRow.addEventListener('dragleave', () => {
                    propRow.style.borderTop = '';
                });

                propRow.addEventListener('drop', async (e) => {
                    e.preventDefault();
                    propRow.style.borderTop = '';

                    if (draggedIndex !== null && draggedIndex !== index) {
                        const draggedItem = config.endFromProperties[draggedIndex];
                        config.endFromProperties.splice(draggedIndex, 1);

                        // Adjust index if needed
                        const newIndex = draggedIndex < index ? index - 1 : index;
                        config.endFromProperties.splice(newIndex, 0, draggedItem);

                        await this.plugin.saveSettings();
                        renderEndPropsList();
                    }
                    draggedIndex = null;
                });
            });

            const addBtn = endPropsListContainer.createEl('button', { text: '+ Add property' });
            addBtn.style.cssText = 'padding: 4px 8px; margin-top: 5px;';
            addBtn.onclick = async () => {
                config.endFromProperties.push('');
                await this.plugin.saveSettings();
                renderEndPropsList();
            };
        };

        // Checkbox first
        this.createCheckboxWithLabel(
            endPropsContainer,
            'From properties',
            config.endFromProperties.length > 0,
            async (checked) => {
                if (checked) {
                    if (config.endFromProperties.length === 0) {
                        config.endFromProperties.push('date_end');
                    }
                    endPropsListContainer.style.display = 'block';
                } else {
                    config.endFromProperties = [];
                    endPropsListContainer.style.display = 'none';
                }
                await this.plugin.saveSettings();
                renderEndPropsList();
                updateEndPriorityVisibility();
            }
        );

        // Properties list container appended after checkbox
        endPropsContainer.appendChild(endPropsListContainer);

        renderEndPropsList();

        // End from filename
        this.createCheckboxWithLabel(
            endSection,
            'From filename (second YYYY-MM-DD pattern)',
            config.endFromFilename,
            async (checked) => {
                config.endFromFilename = checked;
                await this.plugin.saveSettings();
                updateEndPriorityVisibility();
            }
        );

        // End priority selection (only show if both are enabled)
        const endPriorityContainer = endSection.createDiv();
        endPriorityContainer.style.cssText = 'margin-top: 10px; padding: 10px; background: var(--background-primary); border-radius: 3px;';

        const updateEndPriorityVisibility = () => {
            const bothEnabled = config.endFromProperties.length > 0 && config.endFromFilename;
            endPriorityContainer.style.display = bothEnabled ? 'block' : 'none';
        };

        endPriorityContainer.createEl('div', {
            text: 'When both are available, prioritize:',
            attr: { style: 'margin-bottom: 8px; font-size: 0.9em; color: var(--text-muted);' }
        });

        const endPriorityOptions = endPriorityContainer.createDiv();
        endPriorityOptions.style.cssText = 'display: flex; gap: 15px;';

        const endPropRadioLabel = endPriorityOptions.createEl('label');
        endPropRadioLabel.style.cssText = 'display: flex; align-items: center; gap: 5px;';
        const endPropRadio = endPropRadioLabel.createEl('input', { type: 'radio', attr: { name: 'end-priority' } });
        endPropRadio.checked = config.endPriority === 'property';
        endPropRadioLabel.createEl('span', { text: 'Property' });
        endPropRadio.onchange = async () => {
            config.endPriority = 'property';
            await this.plugin.saveSettings();
        };

        const endFilenameRadioLabel = endPriorityOptions.createEl('label');
        endFilenameRadioLabel.style.cssText = 'display: flex; align-items: center; gap: 5px;';
        const endFilenameRadio = endFilenameRadioLabel.createEl('input', { type: 'radio', attr: { name: 'end-priority' } });
        endFilenameRadio.checked = config.endPriority === 'filename';
        endFilenameRadioLabel.createEl('span', { text: 'Filename' });
        endFilenameRadio.onchange = async () => {
            config.endPriority = 'filename';
            await this.plugin.saveSettings();
        };

        updateEndPriorityVisibility();
    }

    renderFiltersSection(containerEl: HTMLElement): void {
        containerEl.createEl('h3', { text: 'Filters (Optional)' });

        const desc = containerEl.createEl('p', {
            cls: 'setting-item-description',
            text: 'By default, all notes with valid dates are shown. Add filters to include or exclude specific notes.'
        });
        desc.style.marginTop = '-10px';
        desc.style.marginBottom = '15px';

        const filterModeContainer = containerEl.createDiv();
        filterModeContainer.style.cssText = 'background: var(--background-secondary); padding: 15px; border-radius: 5px; margin-bottom: 15px;';

        // Filter mode selection
        filterModeContainer.createEl('div', {
            text: 'Filter mode:',
            attr: { style: 'margin-bottom: 10px; font-weight: 500;' }
        });

        const modeOptions = filterModeContainer.createDiv();
        modeOptions.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

        const createModeOption = (value: 'none' | 'include' | 'exclude', label: string, description: string) => {
            const optionLabel = modeOptions.createEl('label');
            optionLabel.style.cssText = 'display: flex; align-items: flex-start; gap: 8px; cursor: pointer;';

            const radio = optionLabel.createEl('input', {
                type: 'radio',
                attr: { name: 'filter-mode' }
            });
            radio.checked = this.plugin.settings.filterMode === value;
            radio.style.cssText = 'margin-top: 3px;';

            const textContainer = optionLabel.createDiv();
            textContainer.createEl('div', { text: label, attr: { style: 'font-weight: 500;' } });
            textContainer.createEl('div', {
                text: description,
                attr: { style: 'font-size: 0.9em; color: var(--text-muted);' }
            });

            radio.onchange = async () => {
                this.plugin.settings.filterMode = value;
                await this.plugin.saveSettings();
                this.display(); // Refresh to show/hide conditions
            };
        };

        createModeOption('none', 'Show all notes', 'Display every note that has a valid date');
        createModeOption('include', 'Only include notes that match', 'Only show notes that meet all the conditions below');
        createModeOption('exclude', 'Exclude notes that match', 'Hide notes that meet all the conditions below');

        // Conditions list (only show if not in 'none' mode)
        if (this.plugin.settings.filterMode !== 'none') {
            const conditionsContainer = containerEl.createDiv();
            conditionsContainer.style.cssText = 'background: var(--background-secondary); padding: 15px; border-radius: 5px;';

            conditionsContainer.createEl('h4', {
                text: 'Conditions',
                attr: { style: 'margin-top: 0; margin-bottom: 10px;' }
            });

            if (this.plugin.settings.filterConditions.length === 0) {
                conditionsContainer.createEl('p', {
                    text: 'No conditions added yet. Click "+ Add condition" to get started.',
                    attr: { style: 'color: var(--text-muted); font-style: italic;' }
                });
            } else {
                this.plugin.settings.filterConditions.forEach((condition, index) => {
                    this.renderCondition(conditionsContainer, condition, index);
                });
            }

            const addCondBtn = conditionsContainer.createEl('button', { text: '+ Add condition' });
            addCondBtn.style.cssText = 'padding: 6px 12px; margin-top: 10px;';
            addCondBtn.onclick = async () => {
                this.plugin.settings.filterConditions.push({
                    property: 'file.folder',
                    operator: 'is',
                    value: ''
                });
                await this.plugin.saveSettings();
                this.display();
            };
        }
    }

    renderCondition(container: HTMLElement, condition: Condition, condIndex: number): void {
        ConditionRenderer.render(container, condition, condIndex, this.plugin.settings.filterConditions, this.app, {
            onSave: async () => { await this.plugin.saveSettings(); },
            onRefresh: () => { this.display(); }
        });
    }

    renderDailyNotesSection(containerEl: HTMLElement): void {
        containerEl.createEl('h3', { text: 'Daily Notes' });

        const desc = containerEl.createEl('p', {
            cls: 'setting-item-description',
            text: 'Daily notes are always accessible via the day numbers in the calendar. You can click any day number to open or create a daily note.'
        });
        desc.style.marginTop = '-10px';
        desc.style.marginBottom = '15px';

        const formatSetting = new Setting(containerEl)
            .setName('Daily note format')
            .addText(text => text
                .setPlaceholder('YYYY-MM-DD')
                .setValue(this.plugin.settings.dailyNoteFormat)
                .onChange(async (value) => {
                    this.plugin.settings.dailyNoteFormat = value;
                    await this.plugin.saveSettings();
                    // Update preview
                    this.updateFormatPreview(previewEl, value || 'YYYY-MM-DD');
                }));

        // Add description with format reference link
        const formatDescEl = formatSetting.descEl;
        formatDescEl.innerHTML = `Filename format for daily notes. <a href="https://momentjs.com/docs/#/displaying/format/" style="color: var(--text-accent);">Format reference</a>`;

        // Add format preview
        const previewEl = formatDescEl.createDiv();
        previewEl.style.cssText = 'margin-top: 4px; color: var(--text-muted); font-size: 0.85em;';
        this.updateFormatPreview(previewEl, this.plugin.settings.dailyNoteFormat);

        new Setting(containerEl)
            .setName('Daily notes folder mode')
            .setDesc('Choose where to look for and create daily notes')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('obsidian', 'Use native Daily Notes plugin\'s "New file location"')
                    .addOption('custom', 'Use custom folder')
                    .setValue(this.plugin.settings.dailyNoteFolderMode)
                    .onChange(async (value) => {
                        this.plugin.settings.dailyNoteFolderMode = value as 'obsidian' | 'custom';
                        await this.plugin.saveSettings();
                        this.display();
                    });
            });

        if (this.plugin.settings.dailyNoteFolderMode === 'custom') {
            new Setting(containerEl)
                .setName('Custom daily notes folder')
                .setDesc('Folder path for daily notes. Searches subfolders too.')
                .addText(text => {
                    text
                        .setPlaceholder('Daily Notes')
                        .setValue(this.plugin.settings.dailyNoteCustomFolder)
                        .onChange(async (value) => {
                            const cleaned = value.replace(/^\/+|\/+$/g, '');
                            this.plugin.settings.dailyNoteCustomFolder = cleaned;
                            await this.plugin.saveSettings();
                        });

                    new FolderSuggest(this.app, text.inputEl);
                });
        }

        // Display options subsection
        const displaySection = containerEl.createDiv();
        displaySection.style.cssText = 'background: var(--background-secondary); padding: 15px; border-radius: 5px; margin-top: 15px;';
        displaySection.createEl('h4', { text: 'Display Options', attr: { style: 'margin-top: 0;' } });

        new Setting(displaySection)
            .setName('Show daily notes in calendar cells')
            .setDesc('Display daily notes as separate note cells in addition to the day number links')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showDailyNotesInCells)
                .onChange(async (value) => {
                    this.plugin.settings.showDailyNotesInCells = value;
                    await this.plugin.saveSettings();
                }));

        // Notes with date and text subsection
        const dateTextSection = containerEl.createDiv();
        dateTextSection.style.cssText = 'background: var(--background-secondary); padding: 15px; border-radius: 5px; margin-top: 15px;';
        dateTextSection.createEl('h4', { text: 'Notes with Date and Text in Title', attr: { style: 'margin-top: 0;' } });

        new Setting(dateTextSection)
            .setName('Show notes with date and text')
            .setDesc('Display notes that have both a date and additional text in their filename (e.g., "2024-01-15 Meeting Notes")')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showNotesWithDateAndText)
                .onChange(async (value) => {
                    this.plugin.settings.showNotesWithDateAndText = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(dateTextSection)
            .setName('Hide date portion in titles')
            .setDesc('When displaying notes in the calendar, hide the date portion of the title and only show the text (e.g., show "Meeting Notes" instead of "2024-01-15 Meeting Notes")')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.hideDateInTitle)
                .onChange(async (value) => {
                    this.plugin.settings.hideDateInTitle = value;
                    await this.plugin.saveSettings();
                }));
    }

    renderPeriodicNotesSection(containerEl: HTMLElement): void {
        const settings = this.plugin.settings.periodicNotes;

        containerEl.createEl('h3', { text: 'Periodic Notes' });

        const desc = containerEl.createEl('p', {
            cls: 'setting-item-description',
            text: 'Configure weekly, monthly, quarterly, yearly, and custom period notes. Compatible with the Periodic Notes plugin.'
        });
        desc.style.marginTop = '-10px';
        desc.style.marginBottom = '15px';

        // General settings section
        const generalSection = containerEl.createDiv();
        generalSection.style.cssText = 'background: var(--background-secondary); padding: 15px; border-radius: 5px; margin-bottom: 15px;';
        generalSection.createEl('h4', { text: 'General', attr: { style: 'margin-top: 0;' } });

        // Use Periodic Notes plugin toggle with GitHub link
        const periodicNotesSetting = new Setting(generalSection)
            .setName('Use Periodic Notes plugin settings (enable only if you know what you are doing)')
            .addToggle(toggle => toggle
                .setValue(settings.usePeriodicNotesPlugin)
                .onChange(async (value) => {
                    settings.usePeriodicNotesPlugin = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        // Set description with HTML link inside the setting
        periodicNotesSetting.descEl.innerHTML = `If the <a href="https://github.com/liamcain/obsidian-periodic-notes" style="color: var(--text-accent);">Periodic Notes plugin</a> is installed and a note type is enabled there, prioritize its settings over the ones below.`;

        // Template folder source setting
        new Setting(generalSection)
            .setName('Template folder source')
            .setDesc('Where to look for template files')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('obsidian', 'Use Obsidian\'s template folder')
                    .addOption('custom', 'Custom folder')
                    .setValue(settings.templateFolderSource)
                    .onChange(async (value) => {
                        settings.templateFolderSource = value as 'obsidian' | 'custom';
                        await this.plugin.saveSettings();
                        this.display();
                    });
            });

        // Custom template folder (only shown when custom is selected)
        if (settings.templateFolderSource === 'custom') {
            new Setting(generalSection)
                .setName('Custom template folder')
                .setDesc('Folder to search for template files')
                .addText(text => {
                    text
                        .setPlaceholder('templates')
                        .setValue(settings.templateCustomFolder)
                        .onChange(async (value) => {
                            const cleaned = value.replace(/^\/+|\/+$/g, '');
                            settings.templateCustomFolder = cleaned;
                            await this.plugin.saveSettings();
                        });
                    new FolderSuggest(this.app, text.inputEl);
                });
        }

        // Note about week start day
        const weekStartNote = generalSection.createEl('p', {
            cls: 'setting-item-description'
        });
        weekStartNote.innerHTML = `Week start day is configured in <strong>Basic Settings</strong> → <strong>Week starts on</strong>.`;
        weekStartNote.style.cssText = 'margin-top: 10px; color: var(--text-muted); font-size: 0.9em;';

        // Weekly Notes section
        this.renderPeriodicNoteTypeSection(containerEl, 'weekly', 'Weekly Notes', settings.weekly, 'gggg-[W]ww');

        // Monthly Notes section
        this.renderPeriodicNoteTypeSection(containerEl, 'monthly', 'Monthly Notes', settings.monthly, 'YYYY-MM');

        // Quarterly Notes section
        this.renderPeriodicNoteTypeSection(containerEl, 'quarterly', 'Quarterly Notes', settings.quarterly, 'YYYY-[Q]Q');

        // Yearly Notes section
        this.renderPeriodicNoteTypeSection(containerEl, 'yearly', 'Yearly Notes', settings.yearly, 'YYYY');

        // Custom Periods section
        this.renderCustomPeriodsSection(containerEl);
    }

    renderPeriodicNoteTypeSection(
        containerEl: HTMLElement,
        type: 'weekly' | 'monthly' | 'quarterly' | 'yearly',
        title: string,
        config: { enabled: boolean; folder: string; format: string; template: string; color?: string },
        defaultFormat: string
    ): void {
        const settings = this.plugin.settings.periodicNotes;
        const section = containerEl.createDiv();
        section.style.cssText = 'background: var(--background-secondary); padding: 15px; border-radius: 5px; margin-bottom: 15px;';
        section.createEl('h4', { text: title, attr: { style: 'margin-top: 0;' } });

        // Check if Periodic Notes plugin has this type enabled
        const periodicNotesPlugin = (this.app as any).plugins?.plugins?.['periodic-notes'];
        const periodicNotesTypeEnabled = periodicNotesPlugin?.settings?.[type]?.enabled;
        const usePluginSettings = settings.usePeriodicNotesPlugin && periodicNotesTypeEnabled;

        // Enable toggle
        new Setting(section)
            .setName(`Enable ${type} notes`)
            .setDesc(`Create ${type} notes when clicking ${type === 'weekly' ? 'week numbers' : type === 'quarterly' ? 'quarter indicators' : type === 'monthly' ? 'month names' : 'year header'}`)
            .addToggle(toggle => toggle
                .setValue(config.enabled)
                .onChange(async (value) => {
                    config.enabled = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        // Week number display mode (only for weekly notes, always shown)
        if (type === 'weekly' && config.enabled) {
            new Setting(section)
                .setName('Week number display')
                .setDesc('How to show week numbers in the calendar')
                .addDropdown(dropdown => {
                    dropdown
                        .addOption('none', 'Hidden')
                        .addOption('above-day', 'Badge below day number')
                        .addOption('extra-column', 'Divider before first day of week')
                        .addOption('header-row', 'Row above month with week spans')
                        .setValue(settings.weekNumberDisplay)
                        .onChange(async (value) => {
                            settings.weekNumberDisplay = value as 'none' | 'above-day' | 'extra-column' | 'header-row';
                            await this.plugin.saveSettings();
                            this.display();
                        });
                });

            // Header-row mode specific settings
            if (settings.weekNumberDisplay === 'header-row') {
                const headerRowSettings = section.createDiv();
                headerRowSettings.style.cssText = 'margin-left: 20px; padding-left: 15px; border-left: 2px solid var(--background-modifier-border); margin-top: 10px; margin-bottom: 10px;';

                this.renderWeekBorderColorSetting(headerRowSettings);

                // Week span borders toggle
                new Setting(headerRowSettings)
                    .setName('Show week span borders')
                    .setDesc('Display thin borders on the bottom of week span cells')
                    .addToggle(toggle => toggle
                        .setValue(this.plugin.settings.showWeekSpanBorders)
                        .onChange(async (value) => {
                            this.plugin.settings.showWeekSpanBorders = value;
                            await this.plugin.saveSettings();
                        }));

                // Tip about cell borders
                const tipNote = headerRowSettings.createDiv();
                tipNote.style.cssText = 'background: var(--background-primary); padding: 10px 12px; border-radius: 4px; border-left: 3px solid var(--text-muted); margin-top: 10px; font-size: 0.85em; color: var(--text-muted);';
                tipNote.innerHTML = `<strong>Tip:</strong> Try turning off cell borders in <code style="background: var(--background-modifier-border); padding: 2px 5px; border-radius: 3px; font-size: 0.9em;">Basic Settings → Calendar Appearance → Show cell borders</code> when using week rows. This calms down the look and improves readability.`;
            }
        }

        if (!config.enabled) return;

        // If using Periodic Notes plugin settings, show notice instead of editable fields
        if (usePluginSettings) {
            const notice = section.createDiv();
            notice.style.cssText = 'background: var(--background-primary); padding: 12px; border-radius: 4px; border-left: 3px solid var(--text-accent); margin-top: 10px;';
            notice.innerHTML = `Using settings from the <a href="https://github.com/liamcain/obsidian-periodic-notes" style="color: var(--text-accent);">Periodic Notes plugin</a>. Disable "Use Periodic Notes plugin settings" above to customize here.`;
            notice.style.fontSize = '0.9em';
            notice.style.color = 'var(--text-muted)';
            return;
        }

        // Folder
        new Setting(section)
            .setName('Folder')
            .setDesc(`Folder where ${type} notes will be stored`)
            .addText(text => {
                text
                    .setPlaceholder('Leave empty for vault root')
                    .setValue(config.folder)
                    .onChange(async (value) => {
                        const cleaned = value.replace(/^\/+|\/+$/g, '');
                        config.folder = cleaned;
                        await this.plugin.saveSettings();
                    });
                new FolderSuggest(this.app, text.inputEl);
            });

        // Format with reference link
        const formatSetting = new Setting(section)
            .setName('Format')
            .addText(text => {
                text
                    .setPlaceholder(defaultFormat)
                    .setValue(config.format)
                    .onChange(async (value) => {
                        config.format = value || defaultFormat;
                        await this.plugin.saveSettings();
                        // Update preview
                        this.updateFormatPreview(previewEl, config.format || defaultFormat);
                    });
            });

        // Add description with format reference link
        const formatDescEl = formatSetting.descEl;
        formatDescEl.innerHTML = `Filename format for ${type} notes. <a href="https://momentjs.com/docs/#/displaying/format/" style="color: var(--text-accent);">Format reference</a>`;

        // Add format preview
        const previewEl = formatDescEl.createDiv();
        previewEl.style.cssText = 'margin-top: 4px; color: var(--text-muted); font-size: 0.85em;';
        this.updateFormatPreview(previewEl, config.format || defaultFormat);

        // Template
        new Setting(section)
            .setName('Template')
            .setDesc(`Template file to use when creating ${type} notes`)
            .addText(text => {
                text
                    .setPlaceholder('templates/weekly')
                    .setValue(config.template)
                    .onChange(async (value) => {
                        config.template = value;
                        await this.plugin.saveSettings();
                    });
                new FileSuggest(this.app, text.inputEl, this.getTemplateFolderPath());
            });

        // Color (optional) with palette support
        const colorSetting = new Setting(section)
            .setName('Color (optional)')
            .setDesc(`Visual indicator color for ${type} notes in the calendar`);

        const colorContainer = colorSetting.controlEl.createDiv();
        colorContainer.style.cssText = 'display: flex; align-items: center; gap: 8px;';

        const colorCheckbox = colorContainer.createEl('input', { type: 'checkbox' });
        colorCheckbox.checked = !!config.color;

        const colorPickerWrapper = colorContainer.createDiv();

        if (config.color) {
            this.renderColorPicker(colorPickerWrapper, config.color, async (newColor) => {
                config.color = newColor;
                await this.plugin.saveSettings();
            });
        } else {
            colorPickerWrapper.createEl('span', { text: 'Using theme accent' }).style.cssText = 'color: var(--text-muted); font-size: 0.85em;';
        }

        colorCheckbox.onchange = async () => {
            if (colorCheckbox.checked) {
                config.color = '#6c849d';
            } else {
                config.color = undefined;
            }
            await this.plugin.saveSettings();
            this.display();
        };

    }

    /**
     * Render the week border color setting with mode options and color picker
     */
    renderWeekBorderColorSetting(container: HTMLElement): void {
        const settings = this.plugin.settings.periodicNotes;
        const borderConfig = settings.weekBorderColor;

        // Color picker wrapper (for custom mode, shown after dropdown)
        let colorWrapper: HTMLElement | null = null;

        const borderSetting = new Setting(container)
            .setName('Week divider color')
            .setDesc('Color for the divider between weeks in the header row and day cells')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('neutral', 'Neutral (theme border)')
                    .addOption('accent', 'Theme accent')
                    .addOption('custom', 'Custom color')
                    .setValue(borderConfig.mode)
                    .onChange(async (value) => {
                        borderConfig.mode = value as 'neutral' | 'accent' | 'custom';
                        await this.plugin.saveSettings();
                        renderColorControl();
                    });
            });

        // Create color wrapper after the dropdown
        colorWrapper = borderSetting.controlEl.createDiv();
        colorWrapper.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-left: 8px;';

        const renderColorControl = () => {
            if (!colorWrapper) return;
            colorWrapper.empty();

            if (borderConfig.mode === 'custom') {
                const currentColor = borderConfig.customColor || '#6c849d';
                this.renderColorPicker(colorWrapper, currentColor, async (newColor) => {
                    borderConfig.customColor = newColor;
                    await this.plugin.saveSettings();
                });
            }
        };

        renderColorControl();
    }

    private updateFormatPreview(previewEl: HTMLElement, format: string): void {
        const moment = (window as any).moment;
        try {
            const preview = moment().format(format);
            previewEl.textContent = `Preview: ${preview}`;
        } catch {
            previewEl.textContent = 'Preview: (invalid format)';
        }
    }

    renderCustomPeriodsSection(containerEl: HTMLElement): void {
        const settings = this.plugin.settings.periodicNotes;

        const section = containerEl.createDiv();
        section.style.cssText = 'background: var(--background-secondary); padding: 15px; border-radius: 5px; margin-bottom: 15px;';
        section.createEl('h4', { text: 'Custom Period Groups', attr: { style: 'margin-top: 0;' } });

        const desc = section.createEl('p', {
            cls: 'setting-item-description',
            text: 'Create groups of custom periods (e.g., Semesters, Seasons). Each enabled group gets its own column in the calendar. Periods within a group cannot have overlapping months and must use consecutive months.'
        });
        desc.style.marginBottom = '15px';

        // Add group button
        const addBtn = section.createEl('button', { text: '+ Add Group' });
        addBtn.style.cssText = 'margin-bottom: 15px; padding: 6px 12px; cursor: pointer;';
        addBtn.onclick = async () => {
            const newGroup: CustomPeriodGroup = {
                id: Date.now().toString(),
                name: 'New Group',
                enabled: true,
                folder: '',
                template: '',
                color: undefined,
                periods: []
            };
            settings.customPeriodGroups.push(newGroup);
            await this.plugin.saveSettings();
            this.display();
        };

        // List existing groups
        if (settings.customPeriodGroups.length === 0) {
            const emptyMsg = section.createDiv();
            emptyMsg.style.cssText = 'color: var(--text-muted); font-style: italic;';
            emptyMsg.textContent = 'No custom period groups defined. Click "Add Group" to create one.';
        } else {
            const groupsList = section.createDiv();
            groupsList.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';

            settings.customPeriodGroups.forEach((group, groupIndex) => {
                const groupEl = groupsList.createDiv();
                groupEl.style.cssText = 'padding: 12px; background: var(--background-primary); border-radius: 4px; border: 1px solid var(--background-modifier-border);';

                // Group header
                const groupHeader = groupEl.createDiv();
                groupHeader.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-bottom: 10px;';

                // Enable toggle
                const toggleContainer = groupHeader.createDiv();
                const toggle = toggleContainer.createEl('input', { type: 'checkbox' });
                toggle.checked = group.enabled;
                toggle.style.cssText = 'cursor: pointer;';
                toggle.onchange = async () => {
                    group.enabled = toggle.checked;
                    await this.plugin.saveSettings();
                };

                // Group name input
                const nameInput = groupHeader.createEl('input', {
                    type: 'text',
                    value: group.name,
                    attr: { placeholder: 'Group name' }
                });
                nameInput.style.cssText = 'flex: 1; padding: 4px 8px; font-weight: 500;';
                nameInput.onchange = async () => {
                    group.name = nameInput.value;
                    await this.plugin.saveSettings();
                };

                // Delete group button
                const deleteGroupBtn = groupHeader.createEl('button', { text: '×' });
                deleteGroupBtn.style.cssText = 'padding: 4px 8px; cursor: pointer; font-size: 1.2em; background: transparent; border: 1px solid var(--background-modifier-border);';
                deleteGroupBtn.title = 'Delete group';
                deleteGroupBtn.onclick = async () => {
                    settings.customPeriodGroups.splice(groupIndex, 1);
                    await this.plugin.saveSettings();
                    this.display();
                };

                // Group-level defaults section
                const groupDefaultsSection = groupEl.createDiv();
                groupDefaultsSection.style.cssText = 'padding: 10px; margin: 10px 0; background: var(--background-secondary); border-radius: 4px;';

                const groupDefaultsLabel = groupDefaultsSection.createDiv();
                groupDefaultsLabel.style.cssText = 'font-size: 0.85em; color: var(--text-muted); margin-bottom: 8px;';
                groupDefaultsLabel.textContent = 'Default settings for all periods in this group:';

                // Folder setting
                const folderRow = groupDefaultsSection.createDiv();
                folderRow.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 6px;';
                folderRow.createEl('span', { text: 'Folder:' }).style.cssText = 'font-size: 0.85em; min-width: 60px;';
                const folderInput = folderRow.createEl('input', {
                    type: 'text',
                    value: group.folder || '',
                    attr: { placeholder: 'Leave empty for vault root' }
                });
                folderInput.style.cssText = 'flex: 1; padding: 4px 8px; font-size: 0.85em;';
                folderInput.onchange = async () => {
                    group.folder = folderInput.value.replace(/^\/+|\/+$/g, '');
                    await this.plugin.saveSettings();
                };
                new FolderSuggest(this.app, folderInput);

                // Template setting
                const templateRow = groupDefaultsSection.createDiv();
                templateRow.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 6px;';
                templateRow.createEl('span', { text: 'Template:' }).style.cssText = 'font-size: 0.85em; min-width: 60px;';
                const templateInput = templateRow.createEl('input', {
                    type: 'text',
                    value: group.template || '',
                    attr: { placeholder: 'templates/period' }
                });
                templateInput.style.cssText = 'flex: 1; padding: 4px 8px; font-size: 0.85em;';
                templateInput.onchange = async () => {
                    group.template = templateInput.value;
                    await this.plugin.saveSettings();
                };
                new FileSuggest(this.app, templateInput, this.getTemplateFolderPath());

                // Color setting with enable checkbox and palette support
                const colorRow = groupDefaultsSection.createDiv();
                colorRow.style.cssText = 'display: flex; align-items: center; gap: 8px; flex-wrap: wrap;';
                colorRow.createEl('span', { text: 'Color:' }).style.cssText = 'font-size: 0.85em; min-width: 60px;';

                const colorCheckbox = colorRow.createEl('input', { type: 'checkbox' });
                colorCheckbox.checked = !!group.color;
                colorCheckbox.style.cssText = 'margin-right: 4px;';

                // Color picker container (only visible when enabled)
                const colorPickerWrapper = colorRow.createDiv();
                colorPickerWrapper.style.cssText = group.color ? 'display: flex; align-items: center; gap: 8px;' : 'display: none;';

                if (group.color) {
                    this.renderColorPicker(
                        colorPickerWrapper,
                        group.color,
                        async (newColor) => {
                            group.color = newColor;
                            await this.plugin.saveSettings();
                        }
                    );
                }

                const colorCheckLabel = colorRow.createEl('span', { text: group.color ? '' : 'Enable group color' });
                colorCheckLabel.style.cssText = 'font-size: 0.85em; color: var(--text-muted);';

                colorCheckbox.onchange = async () => {
                    if (colorCheckbox.checked) {
                        group.color = '#4a90d9';  // Default color
                    } else {
                        group.color = undefined;
                    }
                    await this.plugin.saveSettings();
                    this.display();
                };

                // Periods within group
                const periodsContainer = groupEl.createDiv();
                periodsContainer.style.cssText = 'margin-left: 20px;';

                if (group.periods.length === 0) {
                    const emptyPeriodsMsg = periodsContainer.createDiv();
                    emptyPeriodsMsg.style.cssText = 'color: var(--text-muted); font-style: italic; font-size: 0.9em; margin-bottom: 8px;';
                    emptyPeriodsMsg.textContent = 'No periods in this group.';
                } else {
                    const periodsList = periodsContainer.createDiv();
                    periodsList.style.cssText = 'display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px;';

                    group.periods.forEach((period, periodIndex) => {
                        const periodEl = periodsList.createDiv();
                        periodEl.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 6px 8px; background: var(--background-secondary); border-radius: 3px;';

                        // Color indicator - show effective color (period's own or group's)
                        const effectiveColor = period.useGroupSettings ? group.color : period.color;
                        if (effectiveColor) {
                            const colorDot = periodEl.createDiv();
                            colorDot.style.cssText = `width: 10px; height: 10px; border-radius: 50%; background: ${effectiveColor}; flex-shrink: 0;`;
                            if (period.useGroupSettings && group.color) {
                                colorDot.title = 'Using group color';
                            }
                        }

                        // Period name, format, months, and custom settings indicator
                        const infoEl = periodEl.createDiv();
                        infoEl.style.cssText = 'flex: 1;';

                        // Name row with custom settings badge
                        const nameRow = infoEl.createDiv();
                        nameRow.style.cssText = 'display: flex; align-items: center; gap: 6px;';

                        const nameEl = nameRow.createEl('span');
                        nameEl.style.cssText = 'font-weight: 500; font-size: 0.9em;';
                        nameEl.textContent = period.name;

                        // Show "Custom" badge if not using group defaults
                        if (period.useGroupSettings === false) {
                            const customBadge = nameRow.createEl('span', { text: 'Custom' });
                            customBadge.style.cssText = 'font-size: 0.7em; padding: 1px 5px; background: var(--interactive-accent); color: var(--text-on-accent); border-radius: 8px;';
                            customBadge.title = 'Using custom folder, template, or color instead of group defaults';
                        }

                        // Format and months info
                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        const monthsText = period.months.map(m => monthNames[m - 1]).join('-');

                        const detailsEl = infoEl.createDiv();
                        detailsEl.style.cssText = 'font-size: 0.8em; color: var(--text-muted);';
                        detailsEl.innerHTML = `<code style="font-size: 0.95em; background: var(--background-modifier-border); padding: 0 4px; border-radius: 2px;">${period.format}</code> · ${monthsText}`;

                        // Edit button
                        const editBtn = periodEl.createEl('button', { text: 'Edit' });
                        editBtn.style.cssText = 'padding: 2px 8px; cursor: pointer; font-size: 0.85em;';
                        editBtn.onclick = () => {
                            new CustomPeriodEditModal(
                                this.app,
                                this.plugin,
                                period,
                                group,
                                async () => {
                                    await this.plugin.saveSettings();
                                    this.display();
                                },
                                async () => {
                                    group.periods.splice(periodIndex, 1);
                                    await this.plugin.saveSettings();
                                    this.display();
                                }
                            ).open();
                        };

                        // Delete period button
                        const deletePeriodBtn = periodEl.createEl('button', { text: '×' });
                        deletePeriodBtn.style.cssText = 'padding: 2px 6px; cursor: pointer; font-size: 1em; background: transparent; border: 1px solid var(--background-modifier-border);';
                        deletePeriodBtn.title = 'Delete period';
                        deletePeriodBtn.onclick = async () => {
                            group.periods.splice(periodIndex, 1);
                            await this.plugin.saveSettings();
                            this.display();
                        };
                    });
                }

                // Add period button
                const addPeriodBtn = periodsContainer.createEl('button', { text: '+ Add Period' });
                addPeriodBtn.style.cssText = 'padding: 4px 10px; cursor: pointer; font-size: 0.9em;';
                addPeriodBtn.onclick = () => {
                    // Find available months (not used by other periods in this group)
                    const usedMonths = new Set<number>();
                    group.periods.forEach(p => p.months.forEach(m => usedMonths.add(m)));
                    const availableMonths = [1,2,3,4,5,6,7,8,9,10,11,12].filter(m => !usedMonths.has(m));

                    // Default to first 3 available months, or empty if none available
                    const defaultMonths = availableMonths.slice(0, 3);

                    const newPeriod: CustomPeriod = {
                        id: Date.now().toString(),
                        name: 'New Period',
                        format: 'YYYY-[P' + (group.periods.length + 1) + ']',
                        months: defaultMonths.length > 0 ? defaultMonths : [1],
                        yearBasis: 'majority' as const,
                        useGroupSettings: true,  // Use group defaults by default
                        folder: '',
                        template: '',
                        color: undefined
                    };
                    group.periods.push(newPeriod);
                    this.plugin.saveSettings();

                    // Open edit modal for new period
                    new CustomPeriodEditModal(
                        this.app,
                        this.plugin,
                        newPeriod,
                        group,
                        async () => {
                            await this.plugin.saveSettings();
                            this.display();
                        },
                        async () => {
                            const idx = group.periods.findIndex(p => p.id === newPeriod.id);
                            if (idx !== -1) {
                                group.periods.splice(idx, 1);
                                await this.plugin.saveSettings();
                                this.display();
                            }
                        }
                    ).open();
                };
            });
        }
    }

    renderQuickNoteCreationSettings(containerEl: HTMLElement): void {
        const config = this.plugin.settings.quickNoteCreation;

        containerEl.createEl('h3', { text: 'Quick Note Creation' });

        const desc = containerEl.createEl('p', {
            cls: 'setting-item-description',
            text: 'Create notes directly from the calendar by Cmd/Ctrl+clicking on day numbers. Click and drag to select a date range for multi-day notes.'
        });
        desc.style.marginTop = '-10px';
        desc.style.marginBottom = '15px';

        // Master toggle
        new Setting(containerEl)
            .setName('Enable quick note creation')
            .setDesc('Create notes directly from the calendar with Cmd/Ctrl+Click')
            .addToggle(toggle => toggle
                .setValue(config.enabled)
                .onChange(async (value) => {
                    config.enabled = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        if (!config.enabled) return;

        // Show Add Note button
        new Setting(containerEl)
            .setName('Show "Add Note" button')
            .setDesc('Display an "Add Note" button in the calendar header for easy access')
            .addToggle(toggle => toggle
                .setValue(config.showAddNoteButton)
                .onChange(async (value) => {
                    config.showAddNoteButton = value;
                    await this.plugin.saveSettings();
                    // Refresh the calendar view to show/hide the button
                    const leaves = this.plugin.app.workspace.getLeavesOfType('linear-calendar');
                    for (const leaf of leaves) {
                        if (leaf.view instanceof LinearCalendarView) {
                            await leaf.view.reload();
                        }
                    }
                }));

        // Divider
        this.renderDivider(containerEl);

        // Default folder setting
        new Setting(containerEl)
            .setName('Default save location')
            .setDesc('Where new notes should be saved by default')
            .addDropdown(dropdown => dropdown
                .addOption('default', 'Same as new notes')
                .addOption('dailynotes', 'Same as daily notes')
                .addOption('custom', 'Custom folder')
                .setValue(config.defaultFolder)
                .onChange(async (value) => {
                    config.defaultFolder = value as 'default' | 'dailynotes' | 'custom';
                    await this.plugin.saveSettings();
                    this.display();
                }));

        // Custom folder input (only show if custom is selected)
        if (config.defaultFolder === 'custom') {
            new Setting(containerEl)
                .setName('Custom folder path')
                .setDesc('Path where quick notes should be saved')
                .addText(text => {
                    text
                        .setPlaceholder('folder/subfolder')
                        .setValue(config.customFolder)
                        .onChange(async (value) => {
                            const cleaned = value.replace(/^\/+|\/+$/g, '');
                            config.customFolder = cleaned;
                            await this.plugin.saveSettings();
                        });

                    new FolderSuggest(this.app, text.inputEl);
                });
        }

        // Divider
        this.renderDivider(containerEl);

        // Default property settings
        containerEl.createEl('h4', { text: 'Default Properties' });

        new Setting(containerEl)
            .setName('Start date property')
            .setDesc('Default property name for start date')
            .addText(text => {
                text
                    .setValue(config.defaultStartDateProperty)
                    .onChange(async (value) => {
                        config.defaultStartDateProperty = value;
                        await this.plugin.saveSettings();
                    });

                // Add property suggestions
                new PropertySuggest(this.app, text.inputEl);
            });

        new Setting(containerEl)
            .setName('End date property')
            .setDesc('Default property name for end date')
            .addText(text => {
                text
                    .setValue(config.defaultEndDateProperty)
                    .onChange(async (value) => {
                        config.defaultEndDateProperty = value;
                        await this.plugin.saveSettings();
                    });

                // Add property suggestions
                new PropertySuggest(this.app, text.inputEl);
            });

        new Setting(containerEl)
            .setName('Category property')
            .setDesc('Default property name for category')
            .addText(text => {
                text
                    .setValue(config.defaultCategoryProperty)
                    .onChange(async (value) => {
                        config.defaultCategoryProperty = value;
                        await this.plugin.saveSettings();
                    });

                // Add property suggestions
                new PropertySuggest(this.app, text.inputEl);
            });

        // Divider
        this.renderDivider(containerEl);

        // Default metadata section
        containerEl.createEl('h4', { text: 'Default Metadata' });

        const metadataDesc = containerEl.createEl('p', {
            cls: 'setting-item-description',
            text: 'Default metadata that will be pre-filled when creating a new note'
        });
        metadataDesc.style.marginBottom = '15px';

        // Render existing default metadata
        config.defaultMetadata.forEach((entry, index) => {
            this.renderDefaultMetadataRow(containerEl, entry, index);
        });

        // Add metadata button
        const addBtn = containerEl.createEl('button', { text: '+ Add Default Metadata' });
        addBtn.style.cssText = 'margin-top: 10px; padding: 6px 12px; cursor: pointer;';
        addBtn.onclick = async () => {
            config.defaultMetadata.push({ key: '', value: '' });
            await this.plugin.saveSettings();
            this.display();
        };
    }

    renderDefaultMetadataRow(container: HTMLElement, entry: { key: string; value: string }, index: number): void {
        const config = this.plugin.settings.quickNoteCreation;

        MetadataRowRenderer.render(container, {
            entry,
            onKeyChange: async (key: string) => {
                config.defaultMetadata[index].key = key;
                await this.plugin.saveSettings();
            },
            onValueChange: async (value: string) => {
                config.defaultMetadata[index].value = value;
                await this.plugin.saveSettings();
            },
            onDelete: async () => {
                config.defaultMetadata.splice(index, 1);
                await this.plugin.saveSettings();
                this.display();
            },
            onRefresh: () => { this.display(); },
            app: this.app
        });
    }

    renderExperimentalSection(containerEl: HTMLElement): void {
        const headerContainer = containerEl.createDiv();
        headerContainer.style.cssText = 'display: flex; align-items: baseline; gap: 10px; margin-bottom: 10px;';

        headerContainer.createEl('h3', { text: 'Note Title Display' });

        const badge = headerContainer.createEl('span');
        badge.textContent = 'Experimental';
        badge.style.cssText = 'background: var(--interactive-accent); color: var(--text-on-accent); padding: 3px 8px; border-radius: 3px; font-size: 0.7em; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;';

        const desc = containerEl.createEl('p', {
            cls: 'setting-item-description',
            text: 'Test different ways to display note titles in calendar cells. These features are experimental and may change.'
        });
        desc.style.marginTop = '-10px';
        desc.style.marginBottom = '15px';

        const exp = this.plugin.settings.experimental;

        const expSection = containerEl.createDiv();
        expSection.style.cssText = 'background: var(--background-secondary); padding: 15px; border-radius: 5px;';

        new Setting(expSection)
            .setName('Multi-line note names')
            .setDesc('Allow note names to wrap to multiple lines instead of truncating. Best for wider cells.')
            .addToggle(toggle => toggle
                .setValue(exp.multilineNotes)
                .onChange(async (value) => {
                    exp.multilineNotes = value;
                    if (value) {
                        exp.verticalText = false;
                    }
                    await this.plugin.saveSettings();
                    this.display();
                }));

        new Setting(expSection)
            .setName('Vertical text rotation')
            .setDesc('Rotate note names 90 degrees vertically. Creative use of vertical space.')
            .addToggle(toggle => toggle
                .setValue(exp.verticalText)
                .onChange(async (value) => {
                    exp.verticalText = value;
                    if (value) {
                        exp.multilineNotes = false;
                    }
                    await this.plugin.saveSettings();
                    this.display();
                }));

        new Setting(expSection)
            .setName('Compact font size')
            .setDesc('Use smaller font size (0.75em) for note names to fit more text.')
            .addToggle(toggle => toggle
                .setValue(exp.compactFontSize)
                .onChange(async (value) => {
                    exp.compactFontSize = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(expSection)
            .setName('Condensed letter spacing')
            .setDesc('Reduce spacing between letters to fit more text in the same space.')
            .addToggle(toggle => toggle
                .setValue(exp.condensedLetters)
                .onChange(async (value) => {
                    exp.condensedLetters = value;
                    await this.plugin.saveSettings();
                }));

        // Welcome Banners Section
        containerEl.createEl('h3', { text: 'Welcome Banners', attr: { style: 'margin-top: 25px;' } });

        const bannerDesc = containerEl.createEl('p', {
            cls: 'setting-item-description',
            text: 'Show welcome banners again to see tips and instructions.'
        });
        bannerDesc.style.marginTop = '-10px';
        bannerDesc.style.marginBottom = '15px';

        const bannerSection = containerEl.createDiv();
        bannerSection.style.cssText = 'background: var(--background-secondary); padding: 15px; border-radius: 5px;';

        new Setting(bannerSection)
            .setName('Show Quick Notes banner')
            .setDesc('Display the Quick Notes welcome banner with tips about creating notes quickly')
            .addButton(button => button
                .setButtonText('Show again')
                .onClick(async () => {
                    this.plugin.settings.quickNoteCreation.hasSeenWelcomeBanner = false;
                    await this.plugin.saveSettings();
                    new (require('obsidian').Notice)('Quick Notes banner will show on next calendar view');
                }));

        new Setting(bannerSection)
            .setName('Show Periodic Notes banner')
            .setDesc('Display the Periodic Notes welcome banner with tips about weekly, monthly, and quarterly notes')
            .addButton(button => button
                .setButtonText('Show again')
                .onClick(async () => {
                    this.plugin.settings.periodicNotes.hasSeenWelcomeBanner = false;
                    await this.plugin.saveSettings();
                    new (require('obsidian').Notice)('Periodic Notes banner will show on next calendar view');
                }));
    }

    renderColorCategoriesSection(containerEl: HTMLElement): void {
        const config = this.plugin.settings.colorCategories;

        containerEl.createEl('h3', { text: 'Color Categories' });

        const descEl = containerEl.createDiv();
        descEl.style.cssText = 'color: var(--text-muted); margin-bottom: 15px;';
        descEl.innerHTML = 'Visually organize notes with colors and icons based on conditions. Categories are checked in order, first match wins.';

        // Enable/disable color categories toggle
        new Setting(containerEl)
            .setName('Enable color categories')
            .setDesc('Turn the color categories feature on or off.')
            .addToggle(toggle => toggle
                .setValue(config.enabled)
                .onChange(async (value) => {
                    config.enabled = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show/hide section
                }));

        // If disabled, show message and return early
        if (!config.enabled) {
            const disabledMsg = containerEl.createDiv();
            disabledMsg.style.cssText = 'color: var(--text-muted); font-style: italic; padding: 20px; text-align: center;';
            disabledMsg.textContent = 'Color categories are currently disabled.';
            return;
        }

        // Settings section (grouped visually)
        const settingsSection = containerEl.createDiv();
        settingsSection.style.cssText = 'background: var(--background-secondary); padding: 15px; border-radius: 6px; margin-bottom: 20px;';

        const settingsHeader = settingsSection.createEl('h4', { text: 'Category Settings' });
        settingsHeader.style.cssText = 'margin-top: 0; margin-bottom: 12px; font-size: 1em; color: var(--text-normal);';

        // Show category index toggle
        new Setting(settingsSection)
            .setName('Show category index')
            .setDesc('Display a row at the top of the calendar showing all categories as clickable chips.')
            .addToggle(toggle => toggle
                .setValue(config.showCategoryIndex)
                .onChange(async (value) => {
                    config.showCategoryIndex = value;
                    await this.plugin.saveSettings();
                }));

        // Show icons in calendar toggle
        new Setting(settingsSection)
            .setName('Show icons in calendar')
            .setDesc('Display category icons before note titles in the calendar. Turn off to show only colors.')
            .addToggle(toggle => toggle
                .setValue(config.showIconsInCalendar)
                .onChange(async (value) => {
                    config.showIconsInCalendar = value;
                    await this.plugin.saveSettings();
                }));

        // Default color section
        const defaultColorSetting = new Setting(settingsSection)
            .setName('Default color')
            .setDesc('Color for notes that don\'t match any category.');

        const defaultColorContainer = defaultColorSetting.controlEl.createDiv();
        defaultColorContainer.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

        // Only show color picker if not using theme accent
        if (config.defaultCategoryColor !== null) {
            this.renderColorPicker(
                defaultColorContainer,
                config.defaultCategoryColor || '#6366f1',
                async (newColor) => {
                    config.defaultCategoryColor = newColor;
                    await this.plugin.saveSettings();
                }
            );
        } else {
            const themeAccentNote = defaultColorContainer.createDiv();
            themeAccentNote.textContent = 'Using theme accent color';
            themeAccentNote.style.cssText = 'color: var(--text-muted); font-size: 0.9em; font-style: italic;';
        }

        // Reset/Custom toggle button
        const toggleRow = defaultColorContainer.createDiv();
        toggleRow.style.cssText = 'margin-top: 4px;';

        const toggleBtn = toggleRow.createEl('button');
        toggleBtn.textContent = config.defaultCategoryColor === null ? 'Use custom color' : 'Use theme accent';
        toggleBtn.style.cssText = 'padding: 4px 12px; cursor: pointer; font-size: 0.9em;';
        toggleBtn.onclick = async () => {
            if (config.defaultCategoryColor === null) {
                config.defaultCategoryColor = '#6366f1';
            } else {
                config.defaultCategoryColor = null;
            }
            await this.plugin.saveSettings();
            this.display();
        };

        // Color Palettes section
        this.renderColorPalettes(containerEl);

        // Visual separator before categories
        const separator = containerEl.createDiv();
        separator.style.cssText = 'height: 1px; background: var(--background-modifier-border); margin: 30px 0 25px 0;';

        // Categories list header
        const categoriesHeader = containerEl.createDiv();
        categoriesHeader.style.cssText = 'margin-bottom: 15px;';

        const categoryTitle = categoriesHeader.createEl('h4', { text: 'Your Categories' });
        categoryTitle.style.cssText = 'margin: 0 0 6px 0; font-size: 1.1em; color: var(--text-normal);';

        const categoryDesc = categoriesHeader.createDiv();
        categoryDesc.style.cssText = 'color: var(--text-muted); font-size: 0.95em;';
        categoryDesc.textContent = 'Create and organize your color categories. Each category can have conditions that determine which notes match.';

        // Categories list container with visual emphasis
        const categoriesContainer = containerEl.createDiv();
        categoriesContainer.style.cssText = 'background: var(--background-primary); border: 2px solid var(--background-modifier-border); border-radius: 8px; padding: 12px; margin-top: 12px;';

        if (config.categories.length > 0) {
            const hintEl = categoriesContainer.createDiv();
            hintEl.style.cssText = 'color: var(--text-muted); font-size: 0.9em; margin-bottom: 12px; padding: 6px 10px; background: var(--background-secondary); border-radius: 4px;';
            hintEl.textContent = '⋮⋮ Drag to reorder priority — first match wins';
        } else {
            const emptyState = categoriesContainer.createDiv();
            emptyState.style.cssText = 'color: var(--text-muted); font-style: italic; text-align: center; padding: 30px 20px;';
            emptyState.textContent = 'No categories yet. Click "+ Add category" below to create your first one.';
        }

        this.renderCategoriesList(categoriesContainer);

        // Add category button
        const addBtn = containerEl.createEl('button', { text: '+ Add category' });
        addBtn.style.cssText = 'margin-top: 12px; padding: 8px 16px; cursor: pointer; background: var(--interactive-accent); color: var(--text-on-accent); border: none; border-radius: 4px; font-weight: 500;';
        addBtn.onmouseenter = () => {
            addBtn.style.opacity = '0.9';
        };
        addBtn.onmouseleave = () => {
            addBtn.style.opacity = '1';
        };
        addBtn.onclick = async () => {
            const newCategory: ColorCategory = {
                id: Date.now().toString(),
                name: 'New Category',
                color: '#6366f1',
                iconType: null,
                iconValue: '',
                conditions: [],
                matchMode: 'all',
                enabled: true
            };
            config.categories.push(newCategory);
            await this.plugin.saveSettings();
            this.display();
        };
    }

    renderCategoriesList(container: HTMLElement): void {
        const config = this.plugin.settings.colorCategories;
        let draggedIndex: number | null = null;

        config.categories.forEach((category, index) => {
            this.renderCategoryItem(container, category, index, {
                onDragStart: () => { draggedIndex = index; },
                onDragEnd: () => { draggedIndex = null; },
                onDragOver: (targetIndex: number) => {
                    if (draggedIndex !== null && draggedIndex !== targetIndex) {
                        const [removed] = config.categories.splice(draggedIndex, 1);
                        config.categories.splice(targetIndex, 0, removed);
                        draggedIndex = targetIndex;
                        this.plugin.saveSettings();
                        this.display();
                    }
                }
            });
        });
    }

    renderCategoryItem(
        container: HTMLElement,
        category: ColorCategory,
        index: number,
        dragHandlers: {
            onDragStart: () => void;
            onDragEnd: () => void;
            onDragOver: (index: number) => void;
        }
    ): void {
        const config = this.plugin.settings.colorCategories;
        const itemEl = container.createDiv();
        itemEl.style.cssText = 'margin-bottom: 12px; border: 1px solid var(--background-modifier-border); border-radius: 5px; background: var(--background-secondary);';

        // Drag events - only allow dragging via drag handle
        itemEl.addEventListener('dragover', (e) => {
            e.preventDefault();
            itemEl.style.border = '2px solid var(--interactive-accent)';
        });

        itemEl.addEventListener('dragleave', () => {
            itemEl.style.border = '1px solid var(--background-modifier-border)';
        });

        itemEl.addEventListener('drop', (e) => {
            e.preventDefault();
            itemEl.style.border = '1px solid var(--background-modifier-border)';
            dragHandlers.onDragOver(index);
        });

        // Track collapsed state using category ID
        const isExpanded = this.expandedCategories.has(category.id);

        // Header
        const header = itemEl.createDiv();
        header.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 10px 12px; cursor: pointer;';

        // Drag handle - make the entire item draggable only when dragging from the handle
        const dragHandle = header.createEl('span', { text: '⋮⋮' });
        dragHandle.style.cssText = 'cursor: grab; opacity: 0.5; user-select: none;';
        dragHandle.draggable = true;

        dragHandle.addEventListener('dragstart', (e) => {
            dragHandle.style.cursor = 'grabbing';
            itemEl.style.opacity = '0.5';
            dragHandlers.onDragStart();
            // Prevent text selection
            e.dataTransfer?.setData('text/plain', '');
        });

        dragHandle.addEventListener('dragend', () => {
            dragHandle.style.cursor = 'grab';
            itemEl.style.opacity = '1';
            itemEl.style.border = '1px solid var(--background-modifier-border)';
            dragHandlers.onDragEnd();
        });

        // Chevron
        const chevron = header.createEl('span', { text: '›' });
        chevron.style.cssText = 'transition: transform 0.2s; font-size: 1.2em; user-select: none;';
        if (isExpanded) {
            chevron.style.transform = 'rotate(90deg)';
        }

        // Unified capsule with color, icon, and name
        const capsule = header.createEl('div');
        capsule.style.cssText = `display: flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 4px; background: ${category.color}; color: #ffffff; flex: 1;`;
        capsule.dataset.categoryId = category.id; // Add ID for finding capsule later

        // Icon preview (if exists) - give it a class so we can find and update it
        const iconPreview = capsule.createEl('span', { cls: 'category-header-icon' });
        iconPreview.style.cssText = 'flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;';
        if (category.iconType && category.iconValue) {
            if (category.iconType === 'emoji') {
                iconPreview.textContent = category.iconValue;
            } else {
                setIcon(iconPreview, category.iconValue);
                iconPreview.style.color = '#ffffff';
            }
        }

        // Category name
        const nameSpan = capsule.createEl('span', { text: category.name });
        nameSpan.style.cssText = 'font-weight: 500;';

        // Conditions count
        const countSpan = header.createEl('span', {
            text: category.conditions.length === 1
                ? '1 condition'
                : `${category.conditions.length} conditions`
        });
        countSpan.style.cssText = 'font-size: 0.85em; color: var(--text-muted);';

        // Enabled toggle
        const enabledCheckbox = header.createEl('input', { type: 'checkbox' });
        enabledCheckbox.checked = category.enabled;
        enabledCheckbox.style.cssText = 'cursor: pointer;';
        enabledCheckbox.onclick = async (e) => {
            e.stopPropagation();
            category.enabled = enabledCheckbox.checked;
            await this.plugin.saveSettings();
        };

        // Delete button
        const deleteBtn = header.createEl('button', { text: '×' });
        deleteBtn.style.cssText = 'padding: 2px 8px; cursor: pointer; font-size: 1.3em; background: transparent; border: none;';
        deleteBtn.onclick = async (e) => {
            e.stopPropagation();
            config.categories.splice(index, 1);
            await this.plugin.saveSettings();
            this.display();
        };

        // Toggle expand/collapse
        header.onclick = (e) => {
            if ((e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'BUTTON') {
                if (isExpanded) {
                    this.expandedCategories.delete(category.id);
                } else {
                    this.expandedCategories.add(category.id);
                }
                this.display();
            }
        };

        // Collapsible content
        if (isExpanded) {
            const content = itemEl.createDiv();
            content.style.cssText = 'padding: 15px; border-top: 1px solid var(--background-modifier-border);';

            // Name input
            const nameLabel = content.createEl('label');
            nameLabel.style.cssText = 'display: block; margin-bottom: 10px;';
            nameLabel.createEl('div', { text: 'Category name:', cls: 'setting-item-name' });
            const nameInput = nameLabel.createEl('input', { type: 'text', value: category.name });
            nameInput.style.cssText = 'width: 100%; padding: 6px; margin-top: 5px;';
            nameInput.onchange = async () => {
                category.name = nameInput.value;
                await this.plugin.saveSettings();
                this.display();
            };

            // Color picker with palette dropdown
            const colorSection = content.createDiv();
            colorSection.style.cssText = 'margin-bottom: 15px;';
            colorSection.createEl('div', { text: 'Color:', cls: 'setting-item-name' });

            const colorPickerWrapper = colorSection.createDiv();
            colorPickerWrapper.style.cssText = 'margin-top: 8px;';

            this.renderColorPicker(
                colorPickerWrapper,
                category.color,
                async (newColor) => {
                    category.color = newColor;
                    await this.plugin.saveSettings();
                    this.display();
                }
            );

            // Use icon checkbox
            this.createCheckboxWithLabel(
                content,
                'Use icon',
                category.iconType !== null,
                async (checked) => {
                    if (checked) {
                        category.iconType = 'emoji';
                        category.iconValue = '⭐';
                    } else {
                        category.iconType = null;
                        category.iconValue = '';
                    }
                    await this.plugin.saveSettings();
                    this.display();
                }
            );

            // Icon settings (if enabled)
            if (category.iconType !== null) {
                const iconSettings = content.createDiv();
                iconSettings.style.cssText = 'margin-left: 25px; margin-bottom: 15px;';

                const iconLabel = iconSettings.createEl('div');
                iconLabel.style.cssText = 'margin-bottom: 8px; color: var(--text-muted); font-size: 0.9em;';
                iconLabel.textContent = 'Search for emoji or Lucide icon:';

                // Icon value input with preview
                const iconInputContainer = iconSettings.createDiv();
                iconInputContainer.style.cssText = 'display: flex; gap: 10px; align-items: center;';

                // Icon preview (moved to left)
                const iconPreviewEl = iconInputContainer.createEl('div');
                iconPreviewEl.style.cssText = 'width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--background-modifier-border); border-radius: 3px; font-size: 1.2em; flex-shrink: 0;';
                if (category.iconValue) {
                    if (category.iconType === 'emoji') {
                        iconPreviewEl.textContent = category.iconValue;
                    } else {
                        setIcon(iconPreviewEl, category.iconValue);
                    }
                }

                const iconInput = iconInputContainer.createEl('input', {
                    type: 'text',
                    value: category.iconValue,
                    attr: { placeholder: 'Type to search icons...' }
                });
                iconInput.style.cssText = 'flex: 1; padding: 6px;';

                // Initialize dataset with existing iconType
                if (category.iconType) {
                    iconInput.dataset.iconType = category.iconType;
                }

                // Save on input event
                const saveIconValue = async () => {
                    category.iconValue = iconInput.value;
                    // Also update iconType from dataset if available
                    if (iconInput.dataset.iconType) {
                        category.iconType = iconInput.dataset.iconType as 'emoji' | 'lucide';
                    }

                    await this.plugin.saveSettings();

                    // Update the header icon preview directly without rebuilding entire UI
                    const capsule = document.querySelector(`[data-category-id="${category.id}"]`);
                    if (capsule) {
                        const headerIcon = capsule.querySelector('.category-header-icon') as HTMLElement;
                        if (headerIcon) {
                            headerIcon.empty();
                            if (category.iconType && category.iconValue) {
                                if (category.iconType === 'emoji') {
                                    headerIcon.textContent = category.iconValue;
                                } else {
                                    setIcon(headerIcon, category.iconValue);
                                    headerIcon.style.color = '#ffffff';
                                }
                            }
                        }
                    }
                };

                iconInput.addEventListener('input', saveIconValue);

                // Attach IconSuggest
                new IconSuggest(iconInput, iconPreviewEl);
            }

            // Conditions section with info icon
            const conditionsHeader = content.createDiv();
            conditionsHeader.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-top: 15px; margin-bottom: 10px;';

            conditionsHeader.createEl('div', {
                text: 'Conditions:',
                attr: { style: 'font-weight: 500; margin: 0;' }
            });

            // Add info icon using shared helper method
            this.renderConditionsInfoIcon(conditionsHeader);

            // Match mode toggle (only show if multiple conditions exist)
            if (category.conditions.length > 1) {
                const matchModeToggle = content.createDiv();
                matchModeToggle.style.cssText = 'display: flex; align-items: center; gap: 8px; font-size: 0.9em; margin-bottom: 10px;';

                const matchModeLabel = matchModeToggle.createEl('span', { text: 'Match:' });
                matchModeLabel.style.cssText = 'color: var(--text-muted);';

                const matchModeSelect = matchModeToggle.createEl('select');
                matchModeSelect.style.cssText = 'padding: 3px 6px;';

                matchModeSelect.createEl('option', { text: 'All (AND)', value: 'all' });
                matchModeSelect.createEl('option', { text: 'Any (OR)', value: 'any' });

                matchModeSelect.value = category.matchMode || 'all';
                matchModeSelect.onchange = async () => {
                    category.matchMode = matchModeSelect.value as 'all' | 'any';
                    await this.plugin.saveSettings();
                };
            }

            const conditionsContainer = content.createDiv();
            conditionsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

            if (category.conditions.length === 0) {
                const emptyMsg = conditionsContainer.createDiv();
                emptyMsg.style.cssText = 'color: var(--text-muted); font-style: italic; padding: 10px;';
                emptyMsg.textContent = 'No conditions yet. Add at least one condition for this category to match notes.';
            } else {
                category.conditions.forEach((condition, condIndex) => {
                    this.renderCategoryCondition(conditionsContainer, category, condition, condIndex);
                });
            }

            // Add condition button
            const addCondBtn = content.createEl('button', { text: '+ Add condition' });
            addCondBtn.style.cssText = 'margin-top: 8px; padding: 4px 12px; cursor: pointer;';
            addCondBtn.onclick = async () => {
                category.conditions.push({
                    property: 'file.name',
                    operator: 'contains',
                    value: ''
                });
                await this.plugin.saveSettings();
                this.display();
            };
        }
    }

    renderCategoryCondition(
        container: HTMLElement,
        category: ColorCategory,
        condition: Condition,
        condIndex: number
    ): void {
        ConditionRenderer.render(container, condition, condIndex, category.conditions, this.app, {
            onSave: async () => { await this.plugin.saveSettings(); },
            onRefresh: () => { this.display(); }
        });
    }

    renderColorPalettes(containerEl: HTMLElement): void {
        const config = this.plugin.settings.colorCategories;

        // Collapsible Color Palettes section
        const palettesSectionContainer = containerEl.createDiv();
        palettesSectionContainer.style.cssText = 'margin-top: 20px; border: 1px solid var(--background-modifier-border); border-radius: 4px; overflow: hidden;';

        // Header (clickable to expand/collapse)
        const palettesHeader = palettesSectionContainer.createDiv();
        palettesHeader.style.cssText = 'padding: 12px; background: var(--background-secondary); cursor: pointer; display: flex; align-items: center; gap: 8px; user-select: none;';

        const chevron = palettesHeader.createEl('span', { text: '›' });
        chevron.style.cssText = 'font-size: 1.2em; transition: transform 0.2s; display: inline-block;';

        const icon = palettesHeader.createEl('span');
        icon.style.cssText = 'display: flex; align-items: center; margin-right: 4px;';
        setIcon(icon, 'palette');

        palettesHeader.createEl('strong', { text: 'Color Palettes' });
        const headerDesc = palettesHeader.createEl('span', { text: '(optional - create reusable color sets)' });
        headerDesc.style.cssText = 'color: var(--text-muted); font-size: 0.9em; margin-left: 8px;';

        // Content (collapsed by default)
        const palettesContent = palettesSectionContainer.createDiv();
        palettesContent.style.cssText = 'padding: 15px; display: none;';

        // Toggle expand/collapse
        palettesHeader.onclick = () => {
            this.isPalettesExpanded = !this.isPalettesExpanded;
            palettesContent.style.display = this.isPalettesExpanded ? 'block' : 'none';
            chevron.style.transform = this.isPalettesExpanded ? 'rotate(90deg)' : 'rotate(0deg)';
        };

        // Restore expanded state
        if (this.isPalettesExpanded) {
            palettesContent.style.display = 'block';
            chevron.style.transform = 'rotate(90deg)';
        }

        // Description
        const desc = palettesContent.createDiv();
        desc.style.cssText = 'color: var(--text-muted); font-size: 0.9em; margin-bottom: 15px;';
        desc.textContent = 'Create custom color palettes to quickly assign colors to categories. Palettes can be shared by copying/pasting the palette text when viewed in source mode.';

        // Palettes list
        config.colorPalettes.forEach((palette, index) => {
            this.renderPalette(palettesContent, palette, index);
        });

        // Add palette button
        const addPaletteBtn = palettesContent.createEl('button', { text: '+ Add Palette' });
        addPaletteBtn.style.cssText = 'padding: 6px 16px; cursor: pointer; margin-top: 10px;';
        addPaletteBtn.onclick = async () => {
            const newPalette: import('./types').ColorPalette = {
                name: 'New Palette',
                colors: [
                    { name: 'Red', hex: '#ef4444' },
                    { name: 'Blue', hex: '#3b82f6' },
                    { name: 'Green', hex: '#10b981' }
                ]
            };
            config.colorPalettes.push(newPalette);
            await this.plugin.saveSettings();
            this.display();
        };
    }

    renderPalette(container: HTMLElement, palette: import('./types').ColorPalette, paletteIndex: number): void {
        const config = this.plugin.settings.colorCategories;

        const paletteEl = container.createDiv();
        paletteEl.style.cssText = 'border: 1px solid var(--background-modifier-border); border-radius: 4px; padding: 12px; margin-bottom: 12px; background: var(--background-primary);';

        // Palette header with name, mode toggle, and delete button
        const paletteHeader = paletteEl.createDiv();
        paletteHeader.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-bottom: 12px;';

        const nameInput = paletteHeader.createEl('input', {
            type: 'text',
            value: palette.name,
            attr: { placeholder: 'Palette name' }
        });
        nameInput.style.cssText = 'flex: 1; padding: 4px 8px; font-weight: 500;';
        nameInput.oninput = async () => {
            palette.name = nameInput.value;
            await this.plugin.saveSettings();
        };

        // Mode toggle button
        const currentMode = this.paletteEditModes.get(paletteIndex) || 'visual';
        const modeToggleBtn = paletteHeader.createEl('button');
        modeToggleBtn.textContent = currentMode === 'visual' ? 'Source' : 'Visual';
        modeToggleBtn.style.cssText = 'padding: 4px 10px; cursor: pointer; font-size: 0.85em;';
        modeToggleBtn.title = currentMode === 'visual' ? 'Switch to source mode' : 'Switch to visual mode';

        const deleteBtn = paletteHeader.createEl('button', { text: '×' });
        deleteBtn.style.cssText = 'padding: 2px 8px; cursor: pointer; font-size: 1.2em; background: var(--background-modifier-error); color: var(--text-on-accent);';
        deleteBtn.onclick = async () => {
            config.colorPalettes.splice(paletteIndex, 1);
            this.paletteEditModes.delete(paletteIndex);
            await this.plugin.saveSettings();
            this.display();
        };

        // Editor container
        const editorContainer = paletteEl.createDiv();

        // Render based on mode
        const renderEditor = () => {
            editorContainer.empty();
            const mode = this.paletteEditModes.get(paletteIndex) || 'visual';

            if (mode === 'visual') {
                // Visual editor mode
                const colorsContainer = editorContainer.createDiv();
                colorsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

                palette.colors.forEach((color, colorIndex) => {
                    const colorRow = colorsContainer.createDiv();
                    colorRow.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 8px; background: var(--background-secondary); border-radius: 4px;';

                    // Color picker
                    const colorPicker = colorRow.createEl('input', { type: 'color', value: color.hex });
                    colorPicker.style.cssText = 'width: 50px; height: 32px; cursor: pointer; border-radius: 4px;';
                    colorPicker.onchange = async (e) => {
                        color.hex = (e.target as HTMLInputElement).value.toLowerCase();
                        await this.plugin.saveSettings();
                    };

                    // Hex display
                    const hexDisplay = colorRow.createEl('code');
                    hexDisplay.textContent = color.hex.toUpperCase();
                    hexDisplay.style.cssText = 'color: var(--text-muted); font-size: 0.85em; min-width: 70px;';

                    colorPicker.oninput = () => {
                        hexDisplay.textContent = colorPicker.value.toUpperCase();
                    };

                    // Color name input
                    const nameInput = colorRow.createEl('input', {
                        type: 'text',
                        value: color.name,
                        attr: { placeholder: 'Color name' }
                    });
                    nameInput.style.cssText = 'flex: 1; padding: 4px 8px;';
                    nameInput.oninput = async () => {
                        color.name = nameInput.value;
                        await this.plugin.saveSettings();
                    };

                    // Delete color button
                    const deleteColorBtn = colorRow.createEl('button', { text: '×' });
                    deleteColorBtn.style.cssText = 'padding: 2px 8px; cursor: pointer; font-size: 1.1em;';
                    deleteColorBtn.onclick = async () => {
                        palette.colors.splice(colorIndex, 1);
                        await this.plugin.saveSettings();
                        renderEditor();
                    };
                });

                // Add color button
                const addColorBtn = editorContainer.createEl('button', { text: '+ Add Color' });
                addColorBtn.style.cssText = 'padding: 6px 12px; cursor: pointer; margin-top: 8px; font-size: 0.9em;';
                addColorBtn.onclick = async () => {
                    palette.colors.push({ name: 'New Color', hex: '#3b82f6' });
                    await this.plugin.saveSettings();
                    renderEditor();
                };

            } else {
                // Source mode
                const sourceLabel = editorContainer.createDiv();
                sourceLabel.style.cssText = 'font-size: 0.85em; color: var(--text-muted); margin-bottom: 6px;';
                sourceLabel.textContent = 'Text format (ColorName: #hexcode, one per line):';

                const paletteText = editorContainer.createEl('textarea');
                paletteText.style.cssText = 'width: 100%; min-height: 120px; font-family: monospace; font-size: 0.85em; padding: 8px; resize: vertical;';
                paletteText.value = this.paletteTOText(palette);

                let typingTimer: NodeJS.Timeout;
                paletteText.oninput = () => {
                    clearTimeout(typingTimer);
                    typingTimer = setTimeout(async () => {
                        const parsed = this.textToPalette(paletteText.value, palette.name);
                        if (parsed) {
                            palette.colors = parsed.colors;
                            await this.plugin.saveSettings();
                        }
                    }, 500);
                };
            }
        };

        // Toggle mode handler
        modeToggleBtn.onclick = () => {
            const currentMode = this.paletteEditModes.get(paletteIndex) || 'visual';
            const newMode = currentMode === 'visual' ? 'source' : 'visual';
            this.paletteEditModes.set(paletteIndex, newMode);
            modeToggleBtn.textContent = newMode === 'visual' ? 'Source' : 'Visual';
            modeToggleBtn.title = newMode === 'visual' ? 'Switch to source mode' : 'Switch to visual mode';
            renderEditor();
        };

        // Initial render
        renderEditor();
    }

    paletteTOText(palette: import('./types').ColorPalette): string {
        return palette.colors.map(c => `${c.name}: ${c.hex}`).join('\n');
    }

    textToPalette(text: string, fallbackName: string): import('./types').ColorPalette | null {
        const lines = text.split('\n').filter(l => l.trim());
        const colors: import('./types').ColorPaletteEntry[] = [];

        for (const line of lines) {
            const match = line.match(/^(.+?):\s*(#[0-9a-fA-F]{6})$/);
            if (match) {
                colors.push({ name: match[1].trim(), hex: match[2].toLowerCase() });
            } else {
                // Invalid format
                return null;
            }
        }

        if (colors.length === 0) return null;

        return { name: fallbackName, colors };
    }

    /**
     * Render a color picker with optional palette selection popover
     */
    renderColorPicker(
        container: HTMLElement,
        currentColor: string,
        onColorChange: (color: string) => Promise<void>
    ): void {
        const config = this.plugin.settings.colorCategories;
        ColorPickerRenderer.render({
            container,
            currentColor,
            palettes: config.colorPalettes || [],
            onColorChange
        });
    }
}

/**
 * Modal for editing a color category
 */
export class CategoryEditModal extends Modal {
    plugin: LinearCalendarPlugin;
    category: ColorCategory;
    onSave: () => void;

    constructor(app: App, plugin: LinearCalendarPlugin, category: ColorCategory, onSave: () => void) {
        super(app);
        this.plugin = plugin;
        this.category = category;
        this.onSave = onSave;
    }

    /**
     * Helper to create a checkbox with label in a consistent format.
     * The checkbox is placed inside a wrapper div, NOT inside a <label> element.
     * This prevents accidental toggling when clicking the label text.
     */
    private createCheckboxWithLabel(
        container: HTMLElement,
        text: string,
        checked: boolean,
        onChange: (checked: boolean) => void | Promise<void>
    ): HTMLInputElement {
        const wrapper = container.createDiv();
        wrapper.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 8px;';

        const checkbox = wrapper.createEl('input', { type: 'checkbox' });
        checkbox.checked = checked;
        checkbox.onchange = async (e) => {
            await onChange((e.target as HTMLInputElement).checked);
        };

        wrapper.createEl('span', { text });

        return checkbox;
    }

    /**
     * IMPORTANT: This method is duplicated from CalendarSettingTab.renderConditionsInfoIcon().
     * When making changes here, apply the same changes to CalendarSettingTab.renderConditionsInfoIcon().
     * This ensures both main settings and modal have consistent info icon behavior.
     */
    renderConditionsInfoIcon(container: HTMLElement): void {
        const infoIcon = container.createEl('span');
        setIcon(infoIcon, 'info');
        infoIcon.style.cssText = 'cursor: pointer; color: var(--text-muted); display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px;';
        infoIcon.title = 'Click to see examples';

        // Create popover (hidden by default)
        let popover: HTMLElement | null = null;

        const closePopover = () => {
            if (popover) {
                popover.remove();
                popover = null;
            }
        };

        infoIcon.onclick = (e) => {
            e.preventDefault();

            // Close existing popover if open
            if (popover) {
                closePopover();
                return;
            }

            // Create popover
            popover = document.body.createDiv();
            popover.style.cssText = 'position: fixed; z-index: 1000; background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 6px; padding: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3); max-width: 280px;';

            // Close button
            const closeBtn = popover.createEl('button');
            closeBtn.textContent = '×';
            closeBtn.style.cssText = 'position: absolute; top: 4px; right: 4px; width: 24px; height: 24px; border: none; background: transparent; cursor: pointer; font-size: 1.4em; line-height: 1; padding: 0; color: var(--text-muted); border-radius: 3px;';
            closeBtn.title = 'Close';
            closeBtn.onmouseenter = () => {
                closeBtn.style.background = 'var(--background-modifier-hover)';
            };
            closeBtn.onmouseleave = () => {
                closeBtn.style.background = 'transparent';
            };
            closeBtn.onclick = (e) => {
                e.preventDefault();
                closePopover();
            };

            // Examples heading
            popover.createEl('div', {
                text: 'Examples:',
                attr: { style: 'font-weight: 600; margin-bottom: 8px; color: var(--text-normal); padding-right: 20px;' }
            });

            // Example items
            popover.createEl('div', {
                text: '• Property "category" is "school"',
                attr: { style: 'margin-left: 8px; color: var(--text-muted); margin-bottom: 4px; font-size: 0.9em;' }
            });
            popover.createEl('div', {
                text: '• File tags has tag "holidays"',
                attr: { style: 'margin-left: 8px; color: var(--text-muted); margin-bottom: 4px; font-size: 0.9em;' }
            });
            popover.createEl('div', {
                text: '• File name contains "meeting"',
                attr: { style: 'margin-left: 8px; color: var(--text-muted); font-size: 0.9em;' }
            });

            // Position near icon
            const iconRect = infoIcon.getBoundingClientRect();
            popover.style.top = (iconRect.bottom + 6) + 'px';
            popover.style.left = iconRect.left + 'px';

            // Adjust if off-screen
            setTimeout(() => {
                if (popover) {
                    const popoverRect = popover.getBoundingClientRect();
                    if (popoverRect.right > window.innerWidth) {
                        popover.style.left = (window.innerWidth - popoverRect.width - 10) + 'px';
                    }
                    if (popoverRect.bottom > window.innerHeight) {
                        popover.style.top = (iconRect.top - popoverRect.height - 6) + 'px';
                    }
                }
            }, 0);

            // Close on click outside
            const closeHandler = (e: MouseEvent) => {
                if (popover && !popover.contains(e.target as Node) && !infoIcon.contains(e.target as Node)) {
                    closePopover();
                    document.removeEventListener('click', closeHandler);
                }
            };

            setTimeout(() => {
                document.addEventListener('click', closeHandler);
            }, 0);

            // Close on Escape key
            const escHandler = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    closePopover();
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
        };
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: 'Edit Category' });

        // Name input
        new Setting(contentEl)
            .setName('Category name')
            .addText(text => text
                .setValue(this.category.name)
                .onChange(async (value) => {
                    this.category.name = value;
                    await this.plugin.saveSettings();
                    this.onSave();
                }));

        // Divider
        contentEl.createEl('div', {
            attr: { style: 'border-top: 1px solid var(--background-modifier-border); margin: 16px 0;' }
        });

        // Color picker with palette support
        const colorSetting = new Setting(contentEl)
            .setName('Color')
            .setDesc('Choose a color for this category');

        this.renderColorPickerInModal(colorSetting.controlEl);

        // Divider
        contentEl.createEl('div', {
            attr: { style: 'border-top: 1px solid var(--background-modifier-border); margin: 16px 0;' }
        });

        // Use icon toggle (manual to prevent clicking label from toggling)
        const useIconSetting = contentEl.createDiv();
        useIconSetting.style.cssText = 'display: flex; flex-direction: column; gap: 4px; padding: 12px 0;';

        const useIconHeader = useIconSetting.createDiv();
        useIconHeader.style.cssText = 'display: flex; flex-direction: column; gap: 4px;';

        this.createCheckboxWithLabel(
            useIconHeader,
            'Use icon',
            this.category.iconType !== null,
            async (checked) => {
                if (checked) {
                    this.category.iconType = 'emoji';
                    this.category.iconValue = '⭐';
                } else {
                    this.category.iconType = null;
                    this.category.iconValue = '';
                }
                await this.plugin.saveSettings();
                this.onSave();
                this.onOpen(); // Refresh to show/hide icon input
            }
        );

        const useIconDesc = useIconSetting.createEl('div');
        useIconDesc.style.cssText = 'font-size: 0.85em; color: var(--text-muted); margin-left: 24px;';
        useIconDesc.textContent = 'Add an emoji or Lucide icon to this category';

        // Icon input (if enabled)
        if (this.category.iconType !== null) {
            const iconSetting = new Setting(contentEl)
                .setName('Icon')
                .setDesc('Search for emoji or Lucide icon');

            const inputContainer = iconSetting.controlEl.createDiv();
            inputContainer.style.cssText = 'display: flex; gap: 10px; align-items: center; width: 100%;';

            const iconInput = inputContainer.createEl('input', {
                type: 'text',
                value: this.category.iconValue,
                attr: { placeholder: 'Type to search icons...' }
            });
            iconInput.style.cssText = 'flex: 1; padding: 6px;';

            // Initialize dataset with existing iconType
            if (this.category.iconType) {
                iconInput.dataset.iconType = this.category.iconType;
            }

            // Save on input
            const saveIconValue = async () => {
                this.category.iconValue = iconInput.value;
                if (iconInput.dataset.iconType) {
                    this.category.iconType = iconInput.dataset.iconType as 'emoji' | 'lucide';
                }
                await this.plugin.saveSettings();
                this.onSave();
            };

            iconInput.addEventListener('input', saveIconValue);

            // Icon preview
            const iconPreviewEl = inputContainer.createEl('div');
            iconPreviewEl.style.cssText = 'width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--background-modifier-border); border-radius: 3px; font-size: 1.2em;';
            if (this.category.iconValue) {
                if (this.category.iconType === 'emoji') {
                    iconPreviewEl.textContent = this.category.iconValue;
                } else {
                    setIcon(iconPreviewEl, this.category.iconValue);
                }
            }

            // Attach IconSuggest
            new IconSuggest(iconInput, iconPreviewEl);
        }

        // Enabled toggle
        new Setting(contentEl)
            .setName('Enabled')
            .setDesc('Toggle this category on/off without deleting it')
            .addToggle(toggle => toggle
                .setValue(this.category.enabled)
                .onChange(async (value) => {
                    this.category.enabled = value;
                    await this.plugin.saveSettings();
                    this.onSave();
                }));

        // Divider
        contentEl.createEl('div', {
            attr: { style: 'border-top: 1px solid var(--background-modifier-border); margin: 20px 0;' }
        });

        // Conditions section with info icon
        const conditionsHeader = contentEl.createDiv();
        conditionsHeader.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-top: 0; margin-bottom: 10px;';

        conditionsHeader.createEl('h3', { text: 'Conditions', attr: { style: 'margin: 0;' } });

        // Add info icon using local method (duplicated from CalendarSettingTab for consistency)
        this.renderConditionsInfoIcon(conditionsHeader);

        // Match mode selector
        new Setting(contentEl)
            .setName('Match mode')
            .setDesc('Choose how conditions should be evaluated')
            .addDropdown(dropdown => dropdown
                .addOption('all', 'AND - All conditions must match')
                .addOption('any', 'OR - Any condition can match')
                .setValue(this.category.matchMode)
                .onChange(async (value) => {
                    this.category.matchMode = value as 'all' | 'any';
                    await this.plugin.saveSettings();
                    this.onSave();
                }));

        const conditionsContainer = contentEl.createDiv();
        conditionsContainer.style.cssText = 'max-height: 300px; overflow-y: auto;';

        if (this.category.conditions.length === 0) {
            conditionsContainer.createEl('div', {
                text: 'No conditions yet. Add at least one condition for this category to match notes.',
                attr: { style: 'color: var(--text-muted); font-style: italic; padding: 10px;' }
            });
        } else {
            this.category.conditions.forEach((condition, index) => {
                this.renderCondition(conditionsContainer, condition, index);
            });
        }

        // Add condition button
        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('+ Add condition')
                .onClick(async () => {
                    this.category.conditions.push({
                        property: 'file.name',
                        operator: 'contains',
                        value: ''
                    });
                    await this.plugin.saveSettings();
                    this.onSave();
                    this.onOpen(); // Refresh modal
                }));

        // Footer with delete (left) and close (right) buttons
        const footerSetting = new Setting(contentEl)
            .setName('')
            .setDesc('')
            .addButton(btn => btn
                .setIcon('trash')
                .setTooltip('Delete category')
                .onClick(async () => {
                    // Confirmation dialog
                    const confirmed = confirm(`Are you sure you want to delete the category "${this.category.name}"?`);
                    if (confirmed) {
                        const config = this.plugin.settings.colorCategories;
                        const index = config.categories.indexOf(this.category);
                        if (index > -1) {
                            config.categories.splice(index, 1);
                            await this.plugin.saveSettings();
                            this.onSave();
                            this.close();
                        }
                    }
                }))
            .addButton(btn => btn
                .setButtonText('Close')
                .setCta()
                .onClick(() => this.close()));
        footerSetting.settingEl.style.cssText = 'border-top: 1px solid var(--background-modifier-border); padding-top: 10px; margin-top: 20px;';
    }

    renderCondition(container: HTMLElement, condition: Condition, condIndex: number): void {
        ConditionRenderer.render(container, condition, condIndex, this.category.conditions, this.app, {
            onSave: async () => {
                await this.plugin.saveSettings();
                this.onSave();
            },
            onRefresh: () => { this.onOpen(); }
        });
    }

    renderColorPickerInModal(container: HTMLElement): void {
        const config = this.plugin.settings.colorCategories;
        ColorPickerRenderer.render({
            container,
            currentColor: this.category.color,
            palettes: config.colorPalettes || [],
            onColorChange: async (newColor) => {
                this.category.color = newColor;
                await this.plugin.saveSettings();
                this.onSave();
            }
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

/**
 * Modal for editing a custom period within a group
 */
export class CustomPeriodEditModal extends Modal {
    plugin: LinearCalendarPlugin;
    period: CustomPeriod;
    group: CustomPeriodGroup;
    onSave: () => void;
    onDelete: () => void;

    constructor(
        app: App,
        plugin: LinearCalendarPlugin,
        period: CustomPeriod,
        group: CustomPeriodGroup,
        onSave: () => void,
        onDelete: () => void
    ) {
        super(app);
        this.plugin = plugin;
        this.period = period;
        this.group = group;
        this.onSave = onSave;
        this.onDelete = onDelete;
    }

    /**
     * Get the template folder path based on settings.
     */
    getTemplateFolderPath(): string | undefined {
        const settings = this.plugin.settings.periodicNotes;

        if (settings.templateFolderSource === 'custom') {
            return settings.templateCustomFolder || undefined;
        }

        // Try to get Obsidian's templates folder from core plugin
        const templatesPlugin = (this.app as any).internalPlugins?.plugins?.['templates'];
        if (templatesPlugin?.enabled && templatesPlugin?.instance?.options?.folder) {
            return templatesPlugin.instance.options.folder;
        }

        // Try Templater plugin as fallback
        const templaterPlugin = (this.app as any).plugins?.plugins?.['templater-obsidian'];
        if (templaterPlugin?.settings?.templates_folder) {
            return templaterPlugin.settings.templates_folder;
        }

        return undefined;
    }

    /**
     * Get months that are used by other periods in this group (not available for selection)
     */
    getUnavailableMonths(): Set<number> {
        const unavailable = new Set<number>();
        for (const p of this.group.periods) {
            if (p.id !== this.period.id) {
                p.months.forEach((m: number) => unavailable.add(m));
            }
        }
        return unavailable;
    }

    /**
     * Check if months array is consecutive (allowing year wrap like [11,12,1,2])
     */
    areMonthsConsecutive(months: number[]): boolean {
        if (months.length <= 1) return true;

        const sorted = [...months].sort((a, b) => a - b);

        // Check if consecutive without wrap
        let isConsecutiveNormal = true;
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i] - sorted[i-1] !== 1) {
                isConsecutiveNormal = false;
                break;
            }
        }
        if (isConsecutiveNormal) return true;

        // Check if consecutive with year wrap (e.g., [11,12,1,2])
        // This means the gap should only be between the highest and lowest month
        // and should wrap around: highest -> 12 -> 1 -> lowest
        const hasDecember = sorted.includes(12);
        const hasJanuary = sorted.includes(1);
        if (!hasDecember || !hasJanuary) return false;

        // Split into high months (>=7) and low months (<=6)
        const highMonths = sorted.filter(m => m >= 7);
        const lowMonths = sorted.filter(m => m <= 6);

        // Check high months are consecutive ending at 12
        for (let i = 1; i < highMonths.length; i++) {
            if (highMonths[i] - highMonths[i-1] !== 1) return false;
        }
        if (highMonths.length > 0 && highMonths[highMonths.length - 1] !== 12) return false;

        // Check low months are consecutive starting at 1
        for (let i = 1; i < lowMonths.length; i++) {
            if (lowMonths[i] - lowMonths[i-1] !== 1) return false;
        }
        if (lowMonths.length > 0 && lowMonths[0] !== 1) return false;

        return true;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: 'Edit Custom Period' });

        // Name
        new Setting(contentEl)
            .setName('Name')
            .setDesc('Display name for this period (e.g., "Semester 1", "Winter")')
            .addText(text => text
                .setPlaceholder('Period name')
                .setValue(this.period.name)
                .onChange(async (value) => {
                    this.period.name = value;
                    await this.plugin.saveSettings();
                    this.onSave();
                }));

        // Months selection
        const monthsSection = contentEl.createDiv();
        monthsSection.style.cssText = 'background: var(--background-secondary); padding: 15px; border-radius: 5px; margin: 15px 0;';

        const monthsHeader = monthsSection.createDiv();
        monthsHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;';
        monthsHeader.createEl('h4', { text: 'Months', attr: { style: 'margin: 0;' } });

        const unavailableMonths = this.getUnavailableMonths();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthsGrid = monthsSection.createDiv();
        monthsGrid.style.cssText = 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;';

        monthNames.forEach((name, index) => {
            const monthNum = index + 1;
            const isSelected = this.period.months.includes(monthNum);
            const isUnavailable = unavailableMonths.has(monthNum);

            const monthBtn = monthsGrid.createEl('button');
            monthBtn.textContent = name;

            if (isUnavailable) {
                monthBtn.style.cssText = `
                    padding: 8px 12px;
                    border: 2px solid var(--background-modifier-border);
                    background: var(--background-modifier-border);
                    color: var(--text-muted);
                    border-radius: 4px;
                    cursor: not-allowed;
                    font-weight: 400;
                    opacity: 0.5;
                `;
                monthBtn.title = 'Used by another period in this group';
            } else {
                monthBtn.style.cssText = `
                    padding: 8px 12px;
                    border: 2px solid ${isSelected ? 'var(--interactive-accent)' : 'var(--background-modifier-border)'};
                    background: ${isSelected ? 'var(--interactive-accent)' : 'var(--background-primary)'};
                    color: ${isSelected ? 'var(--text-on-accent)' : 'var(--text-normal)'};
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: ${isSelected ? '600' : '400'};
                    transition: all 0.15s;
                `;

                monthBtn.onclick = async () => {
                    let newMonths: number[];
                    if (isSelected) {
                        newMonths = this.period.months.filter(m => m !== monthNum);
                    } else {
                        newMonths = [...this.period.months, monthNum];
                    }

                    // Validate consecutive months
                    if (!this.areMonthsConsecutive(newMonths)) {
                        // Show warning but still allow (will show error message)
                    }

                    this.period.months = newMonths.sort((a, b) => a - b);
                    await this.plugin.saveSettings();
                    this.onSave();
                    this.onOpen(); // Refresh
                };
            }
        });

        // Validation message
        const validationEl = monthsSection.createDiv();
        validationEl.style.cssText = 'margin-top: 10px; font-size: 0.85em;';

        if (this.period.months.length === 0) {
            validationEl.style.color = 'var(--text-error)';
            validationEl.textContent = '⚠ Please select at least one month.';
        } else if (!this.areMonthsConsecutive(this.period.months)) {
            validationEl.style.color = 'var(--text-error)';
            validationEl.textContent = '⚠ Months must be consecutive. Remove gaps between selected months.';
        } else {
            validationEl.style.color = 'var(--text-muted)';
            validationEl.textContent = 'Tip: Months can wrap across year boundary (e.g., Nov-Dec-Jan-Feb for Winter).';
        }

        // Year basis (for year-spanning periods)
        new Setting(contentEl)
            .setName('Year basis')
            .setDesc('Which year to use when the period spans across year boundary')
            .addDropdown(dropdown => dropdown
                .addOption('start', 'Use year of first month')
                .addOption('end', 'Use year of last month')
                .addOption('majority', 'Use year where most months fall')
                .setValue(this.period.yearBasis)
                .onChange(async (value) => {
                    this.period.yearBasis = value as 'start' | 'end' | 'majority';
                    await this.plugin.saveSettings();
                    this.onSave();
                }));

        // Format (always needed, not tied to group settings)
        const formatSetting = new Setting(contentEl)
            .setName('Format')
            .addText(text => text
                .setPlaceholder('YYYY-[S1]')
                .setValue(this.period.format)
                .onChange(async (value) => {
                    this.period.format = value;
                    await this.plugin.saveSettings();
                    this.onSave();
                    // Update preview
                    this.updateFormatPreview(previewEl);
                }));

        // Add description with format reference link
        formatSetting.descEl.innerHTML = `Filename format for period notes. <a href="https://momentjs.com/docs/#/displaying/format/" style="color: var(--text-accent);">Format reference</a>`;

        // Format preview
        const previewEl = formatSetting.descEl.createDiv();
        previewEl.style.cssText = 'margin-top: 4px; color: var(--text-muted); font-size: 0.85em;';
        this.updateFormatPreview(previewEl);

        // Use group settings toggle
        const useGroupSettingsSection = contentEl.createDiv();
        useGroupSettingsSection.style.cssText = 'background: var(--background-secondary); padding: 15px; border-radius: 5px; margin: 15px 0;';

        new Setting(useGroupSettingsSection)
            .setName('Use group defaults')
            .setDesc(`Use the group's folder, template, and color settings`)
            .addToggle(toggle => toggle
                .setValue(this.period.useGroupSettings !== false)  // Default to true
                .onChange(async (value) => {
                    this.period.useGroupSettings = value;
                    await this.plugin.saveSettings();
                    this.onSave();
                    this.onOpen();  // Refresh to show/hide individual settings
                }));

        // Show group defaults info when using group settings
        if (this.period.useGroupSettings !== false) {
            const groupInfoEl = useGroupSettingsSection.createDiv();
            groupInfoEl.style.cssText = 'font-size: 0.85em; color: var(--text-muted); padding: 8px; background: var(--background-primary); border-radius: 4px; margin-top: 8px;';
            groupInfoEl.innerHTML = `
                <div style="margin-bottom: 4px;"><strong>Group "${this.group.name}" defaults:</strong></div>
                <div>Folder: ${this.group.folder || '(vault root)'}</div>
                <div>Template: ${this.group.template || '(none)'}</div>
                <div>Color: ${this.group.color ? `<span style="display:inline-block; width:12px; height:12px; background:${this.group.color}; border-radius:2px; vertical-align:middle;"></span> ${this.group.color}` : '(none)'}</div>
            `;
        } else {
            // Individual settings - only shown when not using group defaults
            const individualSettingsLabel = useGroupSettingsSection.createDiv();
            individualSettingsLabel.style.cssText = 'font-size: 0.85em; color: var(--text-muted); margin-top: 8px; margin-bottom: 4px;';
            individualSettingsLabel.textContent = 'Custom settings for this period:';

            // Folder
            new Setting(useGroupSettingsSection)
                .setName('Folder')
                .setDesc('Folder where notes for this period will be stored')
                .addText(text => {
                    text
                        .setPlaceholder('Leave empty for vault root')
                        .setValue(this.period.folder)
                        .onChange(async (value) => {
                            const cleaned = value.replace(/^\/+|\/+$/g, '');
                            this.period.folder = cleaned;
                            await this.plugin.saveSettings();
                            this.onSave();
                        });
                    new FolderSuggest(this.app, text.inputEl);
                });

            // Template
            new Setting(useGroupSettingsSection)
                .setName('Template')
                .setDesc('Template file to use when creating notes for this period')
                .addText(text => {
                    text
                        .setPlaceholder('templates/semester')
                        .setValue(this.period.template)
                        .onChange(async (value) => {
                            this.period.template = value;
                            await this.plugin.saveSettings();
                            this.onSave();
                        });
                    new FileSuggest(this.app, text.inputEl, this.getTemplateFolderPath());
                });

            // Color (optional) with palette support
            const colorSetting = new Setting(useGroupSettingsSection)
                .setName('Color (optional)')
                .setDesc('Visual indicator color for this period in the calendar');

            const colorContainer = colorSetting.controlEl.createDiv();
            colorContainer.style.cssText = 'display: flex; align-items: center; gap: 8px; flex-wrap: wrap;';

            const colorEnabled = colorContainer.createEl('input', { type: 'checkbox' });
            colorEnabled.checked = !!this.period.color;

            const colorPickerWrapper = colorContainer.createDiv();
            colorPickerWrapper.style.cssText = this.period.color ? 'display: flex; align-items: center;' : 'display: none;';

            if (this.period.color) {
                const config = this.plugin.settings.colorCategories;
                ColorPickerRenderer.render({
                    container: colorPickerWrapper,
                    currentColor: this.period.color,
                    palettes: config.colorPalettes || [],
                    onColorChange: async (newColor) => {
                        this.period.color = newColor;
                        await this.plugin.saveSettings();
                        this.onSave();
                    }
                });
            }

            const colorLabel = colorContainer.createSpan({ text: this.period.color ? '' : 'Enable color' });
            colorLabel.style.cssText = 'font-size: 0.9em; color: var(--text-muted);';

            colorEnabled.onchange = async () => {
                if (colorEnabled.checked) {
                    this.period.color = '#4a90d9';  // Default color
                } else {
                    this.period.color = undefined;
                }
                await this.plugin.saveSettings();
                this.onSave();
                this.onOpen();  // Refresh to show/hide color picker
            };
        }

        // Footer with delete and close buttons
        const footer = contentEl.createDiv();
        footer.style.cssText = 'display: flex; justify-content: space-between; margin-top: 20px; padding-top: 15px; border-top: 1px solid var(--background-modifier-border);';

        const deleteBtn = footer.createEl('button', { text: 'Delete Period' });
        deleteBtn.style.cssText = 'padding: 8px 16px; cursor: pointer; color: var(--text-error); background: transparent; border: 1px solid var(--text-error); border-radius: 4px;';
        deleteBtn.onclick = async () => {
            const confirmed = confirm(`Are you sure you want to delete "${this.period.name}"?`);
            if (confirmed) {
                await this.onDelete();
                this.close();
            }
        };

        const closeBtn = footer.createEl('button', { text: 'Close', cls: 'mod-cta' });
        closeBtn.style.cssText = 'padding: 8px 16px; cursor: pointer;';
        closeBtn.onclick = () => this.close();
    }

    updateFormatPreview(previewEl: HTMLElement): void {
        const moment = (window as any).moment;
        try {
            const preview = moment().format(this.period.format || 'YYYY-[P1]');
            previewEl.textContent = `Preview: ${preview}`;
        } catch {
            previewEl.textContent = 'Preview: (invalid format)';
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
