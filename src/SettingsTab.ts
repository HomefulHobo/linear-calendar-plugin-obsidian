import { App, PluginSettingTab, Setting } from 'obsidian';
import LinearCalendarPlugin from './main';
import { Condition } from './types';
import { FolderSuggest } from './FolderSuggest';

export class CalendarSettingTab extends PluginSettingTab {
    plugin: LinearCalendarPlugin;

    constructor(app: App, plugin: LinearCalendarPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Linear Calendar Settings' });

        // Development notice
        this.renderDevelopmentNotice(containerEl);

        // Calendar appearance section
        this.renderCalendarAppearanceSection(containerEl);

        // Divider
        this.renderDivider(containerEl);

        // Date extraction section
        this.renderDateExtractionSection(containerEl);

        // Divider
        this.renderDivider(containerEl);

        // Filters section
        this.renderFiltersSection(containerEl);

        // Divider
        this.renderDivider(containerEl);

        // Daily notes section
        this.renderDailyNotesSection(containerEl);

        // Divider
        this.renderDivider(containerEl);

        // Experimental features section
        this.renderExperimentalSection(containerEl);
    }

    renderDevelopmentNotice(containerEl: HTMLElement): void {
        const noticeEl = containerEl.createDiv();
        noticeEl.style.cssText = 'background: var(--background-secondary); border-left: 4px solid var(--interactive-accent); padding: 15px 20px; margin: 15px 0 20px 0; border-radius: 3px;';

        const titleEl = noticeEl.createEl('div');
        titleEl.style.cssText = 'font-weight: 600; margin-bottom: 8px; color: var(--text-normal);';
        titleEl.textContent = '⚠️ Early Development';

        const textEl = noticeEl.createEl('div');
        textEl.style.cssText = 'font-size: 0.95em; line-height: 1.5; color: var(--text-muted);';
        textEl.innerHTML = `
            This plugin is in early development and may undergo significant changes. The core functionality—how notes are recognized and dates are extracted—will remain stable. If you use properties or dates in filenames, these will continue to work.<br><br>
            New features are actively being developed. If you encounter any issues or have feedback, please reach out via <a href="https://github.com/HomefulHobo/linear-calendar-plugin-obsidian/" style="color: var(--interactive-accent);">GitHub</a> or via <a href="https://www.homefulhobo.com/contact/" style="color: var(--interactive-accent);">e-mail</a>.
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

        const startPropsLabel = startPropsContainer.createEl('label');
        startPropsLabel.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 8px;';

        const startPropsCheckbox = startPropsLabel.createEl('input', { type: 'checkbox' });
        startPropsCheckbox.checked = config.startFromProperties.length > 0;
        startPropsLabel.createEl('span', { text: 'From properties', attr: { style: 'font-weight: 500;' } });

        // Properties list
        const startPropsListContainer = startPropsContainer.createDiv();
        startPropsListContainer.style.cssText = 'margin-left: 28px;';
        if (config.startFromProperties.length === 0) {
            startPropsListContainer.style.display = 'none';
        }

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

        startPropsCheckbox.onchange = async (e) => {
            if ((e.target as HTMLInputElement).checked) {
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
        };

        // Start from filename
        const startFilenameLabel = startSection.createEl('label');
        startFilenameLabel.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 15px;';

        const startFilenameCheckbox = startFilenameLabel.createEl('input', { type: 'checkbox' });
        startFilenameCheckbox.checked = config.startFromFilename;
        startFilenameLabel.createEl('span', { text: 'From filename (first YYYY-MM-DD pattern)', attr: { style: 'font-weight: 500;' } });

        startFilenameCheckbox.onchange = async (e) => {
            config.startFromFilename = (e.target as HTMLInputElement).checked;
            await this.plugin.saveSettings();
            updatePriorityVisibility();
        };

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

        const endPropsLabel = endPropsContainer.createEl('label');
        endPropsLabel.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 8px;';

        const endPropsCheckbox = endPropsLabel.createEl('input', { type: 'checkbox' });
        endPropsCheckbox.checked = config.endFromProperties.length > 0;
        endPropsLabel.createEl('span', { text: 'From properties', attr: { style: 'font-weight: 500;' } });

        // Properties list
        const endPropsListContainer = endPropsContainer.createDiv();
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

        renderEndPropsList();

        endPropsCheckbox.onchange = async (e) => {
            if ((e.target as HTMLInputElement).checked) {
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
        };

        // End from filename
        const endFilenameLabel = endSection.createEl('label');
        endFilenameLabel.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 15px;';

        const endFilenameCheckbox = endFilenameLabel.createEl('input', { type: 'checkbox' });
        endFilenameCheckbox.checked = config.endFromFilename;
        endFilenameLabel.createEl('span', { text: 'From filename (second YYYY-MM-DD pattern)', attr: { style: 'font-weight: 500;' } });

        endFilenameCheckbox.onchange = async (e) => {
            config.endFromFilename = (e.target as HTMLInputElement).checked;
            await this.plugin.saveSettings();
            updateEndPriorityVisibility();
        };

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
        const condEl = container.createDiv();
        condEl.style.cssText = 'display: flex; gap: 5px; align-items: center; margin-bottom: 8px; flex-wrap: wrap; padding: 8px; background: var(--background-primary); border-radius: 3px;';

        // Property selector
        const propertySelect = condEl.createEl('select');
        propertySelect.style.cssText = 'padding: 4px 8px;';
        const properties = [
            { value: 'file.name', label: 'File name' },
            { value: 'file.basename', label: 'File basename' },
            { value: 'file.folder', label: 'Folder' },
            { value: 'file.path', label: 'File path' },
            { value: 'file.ext', label: 'Extension' },
            { value: 'custom', label: 'Custom property...' }
        ];
        properties.forEach(prop => {
            const option = propertySelect.createEl('option', {
                text: prop.label,
                value: prop.value
            });
            if (condition.property === prop.value ||
                (prop.value === 'custom' && !properties.find(p => p.value === condition.property))) {
                option.selected = true;
            }
        });
        propertySelect.onchange = async (e) => {
            if ((e.target as HTMLSelectElement).value === 'custom') {
                condition.property = '';
            } else {
                condition.property = (e.target as HTMLSelectElement).value;
            }
            await this.plugin.saveSettings();
            this.display();
        };

        // If custom property, show text input
        if (propertySelect.value === 'custom' || !properties.find(p => p.value === condition.property)) {
            const customInput = condEl.createEl('input', {
                type: 'text',
                attr: { placeholder: 'property name' },
                value: condition.property
            });
            customInput.style.cssText = 'padding: 4px 8px; width: 120px;';
            customInput.onchange = async (e) => {
                condition.property = (e.target as HTMLInputElement).value;
                await this.plugin.saveSettings();
            };
        }

        // Operator selector
        const operatorSelect = condEl.createEl('select');
        operatorSelect.style.cssText = 'padding: 4px 8px;';
        const operators = [
            { value: 'is', label: 'is' },
            { value: 'isNot', label: 'is not' },
            { value: 'contains', label: 'contains' },
            { value: 'doesNotContain', label: 'does not contain' },
            { value: 'startsWith', label: 'starts with' },
            { value: 'endsWith', label: 'ends with' },
            { value: 'matches', label: 'matches regex' },
            { value: 'exists', label: 'exists' },
            { value: 'doesNotExist', label: 'does not exist' },
            { value: 'hasTag', label: 'has tag' },
            { value: 'matchesDatePattern', label: 'matches date pattern' }
        ];
        operators.forEach(op => {
            const option = operatorSelect.createEl('option', {
                text: op.label,
                value: op.value
            });
            if (condition.operator === op.value) {
                option.selected = true;
            }
        });
        operatorSelect.onchange = async (e) => {
            condition.operator = (e.target as HTMLSelectElement).value as any;
            await this.plugin.saveSettings();
            this.display();
        };

        // Value input (not needed for exists/doesNotExist)
        if (!['exists', 'doesNotExist'].includes(condition.operator)) {
            const valueInput = condEl.createEl('input', {
                type: 'text',
                attr: { placeholder: 'value' },
                value: condition.value || ''
            });
            valueInput.style.cssText = 'padding: 4px 8px; flex: 1; min-width: 120px;';
            valueInput.onchange = async (e) => {
                condition.value = (e.target as HTMLInputElement).value;
                await this.plugin.saveSettings();
            };
        }

        // Include subfolders option for folder property
        if (condition.property === 'file.folder' && condition.operator === 'is') {
            const subfolderLabel = condEl.createEl('label');
            subfolderLabel.style.cssText = 'display: flex; align-items: center; gap: 5px;';
            const subfolderCheckbox = subfolderLabel.createEl('input', { type: 'checkbox' });
            subfolderCheckbox.checked = condition.includeSubfolders || false;
            subfolderCheckbox.onchange = async (e) => {
                condition.includeSubfolders = (e.target as HTMLInputElement).checked;
                await this.plugin.saveSettings();
            };
            subfolderLabel.createEl('span', { text: 'Include subfolders' });
        }

        // Require additional text option for date pattern
        if (condition.operator === 'matchesDatePattern') {
            const requireTextLabel = condEl.createEl('label');
            requireTextLabel.style.cssText = 'display: flex; align-items: center; gap: 5px;';
            const requireTextCheckbox = requireTextLabel.createEl('input', { type: 'checkbox' });
            requireTextCheckbox.checked = condition.requireAdditionalText || false;
            requireTextCheckbox.onchange = async (e) => {
                condition.requireAdditionalText = (e.target as HTMLInputElement).checked;
                await this.plugin.saveSettings();
            };
            requireTextLabel.createEl('span', { text: 'and has text after date' });
        }

        // Delete condition button
        const deleteBtn = condEl.createEl('button', { text: '×' });
        deleteBtn.style.cssText = 'padding: 2px 10px; cursor: pointer; font-size: 1.2em;';
        deleteBtn.onclick = async () => {
            this.plugin.settings.filterConditions.splice(condIndex, 1);
            await this.plugin.saveSettings();
            this.display();
        };
    }

    renderDailyNotesSection(containerEl: HTMLElement): void {
        containerEl.createEl('h3', { text: 'Daily Notes' });

        const desc = containerEl.createEl('p', {
            cls: 'setting-item-description',
            text: 'Daily notes are always accessible via the day numbers in the calendar. You can click any day number to open or create a daily note.'
        });
        desc.style.marginTop = '-10px';
        desc.style.marginBottom = '15px';

        new Setting(containerEl)
            .setName('Daily note format')
            .setDesc('Format for daily note filenames (use YYYY for year, MM for month, DD for day)')
            .addText(text => text
                .setPlaceholder('YYYY-MM-DD')
                .setValue(this.plugin.settings.dailyNoteFormat)
                .onChange(async (value) => {
                    this.plugin.settings.dailyNoteFormat = value;
                    await this.plugin.saveSettings();
                }));

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

    renderExperimentalSection(containerEl: HTMLElement): void {
        const headerContainer = containerEl.createDiv();
        headerContainer.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-bottom: 10px;';

        headerContainer.createEl('h3', { text: 'Note Title Display' });

        const badge = headerContainer.createEl('span');
        badge.textContent = 'Experimental';
        badge.style.cssText = 'background: var(--interactive-accent); color: var(--text-on-accent); padding: 2px 8px; border-radius: 3px; font-size: 0.75em; font-weight: 600;';

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
    }
}
