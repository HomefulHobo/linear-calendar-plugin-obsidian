import { App, Modal, Notice, Setting, TFile } from 'obsidian';
import type LinearCalendarPlugin from './main';
import type { MetadataEntry } from './types';
import { PropertySuggest } from './PropertySuggest';
import { ValueSuggest } from './ValueSuggest';
import { TagSuggest } from './TagSuggest';

export class QuickNoteModal extends Modal {
    plugin: LinearCalendarPlugin;
    startDate: Date | null;
    endDate: Date | null;
    noteTitle: string = '';
    startDateMethod: 'property' | 'filename' = 'property';
    endDateMethod: 'property' | 'filename' = 'property';
    startDateProperty: string;
    startDateValue: string;
    endDateProperty: string;
    endDateValue: string;
    includeEndDate: boolean = false;
    selectedFolder: string;
    metadata: MetadataEntry[] = [];

    constructor(app: App, plugin: LinearCalendarPlugin, startDate: Date | null, endDate: Date | null) {
        super(app);
        this.plugin = plugin;
        this.startDate = startDate;
        this.endDate = endDate;

        // Initialize from settings
        const config = plugin.settings.quickNoteCreation;
        this.startDateProperty = config.defaultStartDateProperty;
        this.endDateProperty = config.defaultEndDateProperty;
        this.startDateValue = startDate ? this.formatDate(startDate) : '';
        this.endDateValue = endDate ? this.formatDate(endDate) : '';
        this.selectedFolder = this.getFolderPath();
        this.includeEndDate = endDate !== null;

        // Initialize with default metadata from settings
        this.metadata = config.defaultMetadata.map(entry => ({
            key: entry.key,
            value: entry.value
        }));
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: 'Create New Note' });

        // Show hint if no dates were preset (opened from Add Note button)
        if (!this.startDate) {
            const hint = contentEl.createEl('div', {
                cls: 'quick-note-hint'
            });
            hint.style.cssText = 'background: var(--background-secondary); padding: 12px; border-radius: 6px; margin-bottom: 20px; border-left: 3px solid var(--interactive-accent);';

            const hintTitle = hint.createEl('strong', { text: '🦈✨ Get Faster' });
            hintTitle.style.cssText = 'display: block; margin-bottom: 6px;';

            const hintText = hint.createEl('div');
            hintText.innerHTML = `
                You can also create notes directly from the calendar:<br>
                • <strong>Cmd/Ctrl+Click</strong> on a day (date number) to create a note for that date<br>
                • <strong>Cmd/Ctrl+Click and drag</strong> to create a multi-day note<br>
                ⚙️ <strong>Configure</strong> your preferred default behavior in this plugin's settings
            `;
        }

        // Note Title input
        new Setting(contentEl)
            .setName('Note Title')
            .setDesc('Enter the title for your new note')
            .addText(text => text
                .setValue(this.noteTitle)
                .onChange(value => this.noteTitle = value));

        // Divider
        contentEl.createEl('div', {
            attr: { style: 'border-top: 1px solid var(--background-modifier-border); margin: 16px 0;' }
        });

        // Start Date section
        this.renderDateSection(contentEl, 'Start Date', true);

        // Divider
        contentEl.createEl('div', {
            attr: { style: 'border-top: 1px solid var(--background-modifier-border); margin: 16px 0;' }
        });

        // End Date section
        this.renderDateSection(contentEl, 'End Date', false);

        // Divider
        contentEl.createEl('div', {
            attr: { style: 'border-top: 1px solid var(--background-modifier-border); margin: 16px 0;' }
        });

        // Metadata section
        this.renderMetadataSection(contentEl);

        // Divider
        contentEl.createEl('div', {
            attr: { style: 'border-top: 1px solid var(--background-modifier-border); margin: 16px 0;' }
        });

        // Folder section
        this.renderFolderSection(contentEl);

        // Divider
        contentEl.createEl('div', {
            attr: { style: 'border-top: 1px solid var(--background-modifier-border); margin: 16px 0;' }
        });

        // Buttons
        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Create Note')
                .setCta()
                .onClick(() => this.createNote()))
            .addButton(btn => btn
                .setButtonText('Cancel')
                .onClick(() => this.close()));
    }

    renderDateSection(container: HTMLElement, label: string, isStartDate: boolean): void {
        const isEndDate = !isStartDate;

        // Toggle for end date
        if (isEndDate) {
            new Setting(container)
                .setName('Include end date')
                .setDesc('Add an end date for multi-day notes')
                .addToggle(toggle => toggle
                    .setValue(this.includeEndDate)
                    .onChange(value => {
                        this.includeEndDate = value;
                        this.onOpen();
                    }));

            if (!this.includeEndDate) return;
        }

        container.createEl('h4', { text: label, attr: { style: 'margin-bottom: 10px;' } });

        // Method selector (Property / Filename)
        new Setting(container)
            .setName('Date method')
            .setDesc(isStartDate ? 'How to store the start date' : 'How to store the end date')
            .addDropdown(dropdown => dropdown
                .addOption('property', 'By property')
                .addOption('filename', 'By filename')
                .setValue(isStartDate ? this.startDateMethod : this.endDateMethod)
                .onChange(value => {
                    if (isStartDate) {
                        this.startDateMethod = value as 'property' | 'filename';
                    } else {
                        this.endDateMethod = value as 'property' | 'filename';
                    }
                    this.onOpen();
                }));

        const method = isStartDate ? this.startDateMethod : this.endDateMethod;

        // Property row (only show if method is 'property')
        if (method === 'property') {
            const propertyContainer = container.createDiv();
            propertyContainer.style.cssText = 'display: flex; align-items: center; gap: 8px; margin: 10px 0;';

            // Property name input
            const propertyInput = propertyContainer.createEl('input', {
                type: 'text',
                value: isStartDate ? this.startDateProperty : this.endDateProperty,
                attr: { placeholder: 'Property name' }
            });
            propertyInput.style.cssText = 'flex: 0 0 150px; padding: 6px 8px;';
            propertyInput.oninput = () => {
                if (isStartDate) {
                    this.startDateProperty = propertyInput.value;
                } else {
                    this.endDateProperty = propertyInput.value;
                }
            };

            // Colon separator
            propertyContainer.createEl('span', { text: ':', attr: { style: 'font-weight: 500;' } });

            // Date value input
            const dateInput = propertyContainer.createEl('input', {
                type: 'text',
                value: isStartDate ? this.startDateValue : this.endDateValue,
                attr: { placeholder: 'YYYY-MM-DD' }
            });
            dateInput.style.cssText = 'flex: 1; padding: 6px 8px;';
            dateInput.oninput = () => {
                if (isStartDate) {
                    this.startDateValue = dateInput.value;
                } else {
                    this.endDateValue = dateInput.value;
                }
            };

            // Add property dropdown helper
            this.addPropertySuggest(propertyInput);
        } else {
            // Filename method - show date value
            const filenameNote = container.createEl('p', {
                text: isStartDate
                    ? `Date will be added to filename: ${this.startDate ? this.formatDate(this.startDate) : 'YYYY-MM-DD'} Title`
                    : `Date will be added to filename: Title – ${this.endDate ? this.formatDate(this.endDate) : 'YYYY-MM-DD'}`,
                cls: 'setting-item-description'
            });
            filenameNote.style.marginTop = '10px';
        }
    }

    renderMetadataSection(container: HTMLElement): void {
        container.createEl('h4', { text: 'Metadata', attr: { style: 'margin-bottom: 10px;' } });

        const desc = container.createEl('p', {
            cls: 'setting-item-description',
            text: 'Add custom properties and tags to your note'
        });
        desc.style.marginBottom = '15px';

        // Render existing metadata
        this.metadata.forEach((entry, index) => {
            this.renderMetadataRow(container, entry, index);
        });

        // Add metadata button
        const addBtn = container.createEl('button', { text: '+ Add Property' });
        addBtn.style.cssText = 'margin-top: 10px; padding: 6px 12px; cursor: pointer;';
        addBtn.onclick = () => {
            this.metadata.push({ key: '', value: '' });
            this.onOpen();
        };
    }

    renderMetadataRow(container: HTMLElement, entry: MetadataEntry, index: number): void {
        const rowContainer = container.createDiv();
        rowContainer.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 8px;';

        // Property name input
        const keyInput = rowContainer.createEl('input', {
            type: 'text',
            value: entry.key,
            attr: { placeholder: 'Property name' }
        });
        keyInput.style.cssText = 'flex: 0 0 150px; padding: 6px 8px;';
        keyInput.oninput = () => {
            const oldKey = this.metadata[index].key;
            const newKey = keyInput.value;

            // Re-render if switching to/from tags
            const wasTag = oldKey === 'tags' || oldKey === 'tag';
            const isTag = newKey === 'tags' || newKey === 'tag';

            this.metadata[index].key = newKey;

            if (isTag !== wasTag) {
                this.onOpen();
            }
        };

        // Add property dropdown helper
        this.addPropertySuggest(keyInput);

        // Colon separator
        rowContainer.createEl('span', { text: ':', attr: { style: 'font-weight: 500;' } });

        // Check if this is a tag property
        const isTagProperty = entry.key === 'tags' || entry.key === 'tag';

        if (isTagProperty) {
            // Tag chip interface
            this.renderTagInput(rowContainer, entry, index);
        } else {
            // Regular property value input
            const valueInput = rowContainer.createEl('input', {
                type: 'text',
                value: entry.value,
                attr: { placeholder: 'Value' }
            });
            valueInput.style.cssText = 'flex: 1; padding: 6px 8px;';
            valueInput.oninput = () => {
                this.metadata[index].value = valueInput.value;
            };

            // Add value dropdown helper based on the key
            this.addValueSuggest(valueInput, () => this.metadata[index].key);
        }

        // Delete button
        const deleteBtn = rowContainer.createEl('button', { text: '×' });
        deleteBtn.style.cssText = 'padding: 4px 10px; cursor: pointer; font-size: 1.2em; flex-shrink: 0;';
        deleteBtn.onclick = () => {
            this.metadata.splice(index, 1);
            this.onOpen();
        };
    }

    renderTagInput(container: HTMLElement, entry: MetadataEntry, index: number): void {
        const tagContainer = container.createDiv();
        tagContainer.style.cssText = 'flex: 1; display: flex; flex-wrap: wrap; gap: 4px; padding: 4px; border: 1px solid var(--background-modifier-border); border-radius: 4px; min-height: 32px; align-items: center;';

        const refreshTags = () => {
            // Clear container but keep it
            tagContainer.empty();

            // Parse current tags
            const tags = this.metadata[index].value
                .split(/[,\s]+/)
                .map(t => t.replace(/^#/, '').trim())
                .filter(t => t.length > 0);

            // Render existing tags as chips
            tags.forEach((tag, tagIndex) => {
                const chip = tagContainer.createEl('span');
                chip.textContent = tag;
                chip.style.cssText = 'background: var(--interactive-accent); color: var(--text-on-accent); padding: 2px 8px; border-radius: 12px; font-size: 0.9em; display: flex; align-items: center; gap: 4px;';

                const removeBtn = chip.createEl('span');
                removeBtn.textContent = '×';
                removeBtn.style.cssText = 'cursor: pointer; font-weight: bold;';
                removeBtn.onclick = () => {
                    tags.splice(tagIndex, 1);
                    this.metadata[index].value = tags.join(', ');
                    refreshTags(); // Just refresh this container
                };
            });

            // Input for adding new tags
            const tagInput = tagContainer.createEl('input', {
                type: 'text',
                attr: { placeholder: 'Add tag...' }
            });
            tagInput.style.cssText = 'flex: 1; min-width: 80px; border: none; outline: none; background: transparent; padding: 2px 4px;';

            // Add tag autocomplete with custom callback
            const tagSuggest = new TagSuggest(this.app, tagInput);
            // Override the default behavior to add tag immediately on selection
            tagSuggest.onSelect = (tag: string) => {
                const newTag = tag.replace(/^#/, '').trim();
                if (newTag && !tags.includes(newTag)) {
                    tags.push(newTag);
                    this.metadata[index].value = tags.join(', ');
                    refreshTags(); // Refresh to show new chip
                }
            };

            tagInput.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const newTag = tagInput.value.replace(/^#/, '').trim();
                    if (newTag && !tags.includes(newTag)) {
                        tags.push(newTag);
                        this.metadata[index].value = tags.join(', ');
                        tagInput.value = '';
                        refreshTags(); // Just refresh this container
                    }
                } else if (e.key === 'Backspace' && tagInput.value === '' && tags.length > 0) {
                    // Remove last tag on backspace
                    tags.pop();
                    this.metadata[index].value = tags.join(', ');
                    refreshTags(); // Just refresh this container
                }
            };

            // Focus the input after refresh
            setTimeout(() => tagInput.focus(), 0);
        };

        // Initial render
        refreshTags();
    }

    addPropertySuggest(input: HTMLInputElement): void {
        new PropertySuggest(this.app, input);
    }

    addValueSuggest(input: HTMLInputElement, getKey: () => string): void {
        new ValueSuggest(this.app, input, getKey);
    }

    renderFolderSection(container: HTMLElement): void {
        new Setting(container)
            .setName('Save location')
            .setDesc(`Current: ${this.selectedFolder || '(vault root)'}`)
            .addText(text => text
                .setValue(this.selectedFolder)
                .onChange(value => this.selectedFolder = value));
    }

    getFolderPath(): string {
        const config = this.plugin.settings.quickNoteCreation;

        switch (config.defaultFolder) {
            case 'default':
                // Obsidian's default new note location
                // @ts-ignore - accessing Obsidian internals
                return this.app.vault.getConfig('newFileLocation') === 'folder'
                    // @ts-ignore
                    ? this.app.vault.getConfig('newFileFolderPath') || ''
                    : '';

            case 'dailynotes':
                // Use daily notes folder from settings (same logic as CalendarView)
                if (this.plugin.settings.dailyNoteFolderMode === 'obsidian') {
                    const dailyNotesPlugin = (this.app as any).internalPlugins?.plugins?.['daily-notes'];

                    if (dailyNotesPlugin && dailyNotesPlugin.enabled) {
                        let folder = dailyNotesPlugin.instance?.options?.folder || '';
                        folder = folder.replace(/^\/+|\/+$/g, '');
                        return folder;
                    }
                    return '';
                } else {
                    return this.plugin.settings.dailyNoteCustomFolder;
                }

            case 'custom':
                return config.customFolder;

            default:
                return '';
        }
    }

    formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    async createNote(): Promise<void> {
        // Validate inputs
        if (!this.noteTitle.trim()) {
            new Notice('Please enter a note title');
            return;
        }

        // Build filename
        let filename = '';

        // Add start date to filename if method is 'filename'
        if (this.startDateMethod === 'filename') {
            filename = this.startDateValue;
        }

        // Add end date to filename if method is 'filename' and included
        if (this.includeEndDate && this.endDateMethod === 'filename') {
            if (filename) {
                filename = `${filename} – ${this.endDateValue}`;
            } else {
                filename = this.endDateValue;
            }
        }

        // Add title at the end
        if (filename) {
            filename = `${filename} ${this.noteTitle.trim()}`;
        } else {
            filename = this.noteTitle.trim();
        }

        // Build frontmatter
        const frontmatter: Record<string, any> = {};

        // Add start date property if method is 'property'
        if (this.startDateMethod === 'property' && this.startDateProperty && this.startDateValue) {
            frontmatter[this.startDateProperty] = this.startDateValue;
        }

        // Add end date property if included and method is 'property'
        if (this.includeEndDate && this.endDateMethod === 'property' && this.endDateProperty && this.endDateValue) {
            frontmatter[this.endDateProperty] = this.endDateValue;
        }

        // Add custom metadata
        this.metadata.forEach(entry => {
            if (entry.key && entry.value) {
                // Handle tags specially
                if (entry.key === 'tags' || entry.key === 'tag') {
                    // Split by comma, hash, or space and clean
                    const tags = entry.value
                        .split(/[,\s]+/)
                        .map(t => t.replace(/^#/, '').trim())
                        .filter(t => t.length > 0);
                    frontmatter[entry.key] = tags.length === 1 ? tags[0] : tags;
                } else {
                    frontmatter[entry.key] = entry.value;
                }
            }
        });

        // Build file content
        let content = '';
        if (Object.keys(frontmatter).length > 0) {
            content += '---\n';
            for (const [key, value] of Object.entries(frontmatter)) {
                if (Array.isArray(value)) {
                    content += `${key}:\n`;
                    value.forEach(v => content += `  - ${v}\n`);
                } else {
                    content += `${key}: ${value}\n`;
                }
            }
            content += '---\n\n';
        }

        // Build full path
        const folder = this.selectedFolder ? `${this.selectedFolder}/` : '';
        const fullPath = `${folder}${filename}.md`;

        try {
            const shouldUseTemplater = this.shouldTemplaterProcess(fullPath);

            if (shouldUseTemplater) {
                // Create empty file for Templater to process
                const newFile = await this.app.vault.create(fullPath, '');

                // Give Templater a moment to detect the file
                await new Promise(resolve => setTimeout(resolve, 100));

                // Wait for Templater to process
                await this.waitForTemplater(newFile);

                // Check if Templater processed the file
                const templaterContent = await this.app.vault.read(newFile);

                if (templaterContent.length > 0) {
                    // Templater processed - merge our frontmatter
                    await this.mergeFrontmatterWithTemplaterOutput(newFile, frontmatter);
                } else {
                    // Templater didn't process - add frontmatter directly
                    await this.app.vault.modify(newFile, content);
                }

                await this.app.workspace.getLeaf(false).openFile(newFile);
            } else {
                // No folder template - create with frontmatter directly
                const newFile = await this.app.vault.create(fullPath, content);
                await this.app.workspace.getLeaf(false).openFile(newFile);
            }

            this.close();
            new Notice(`Created note: ${filename}`);
        } catch (error) {
            new Notice(`Error creating note: ${(error as Error).message}`);
        }
    }

    async mergeFrontmatterWithTemplaterOutput(file: TFile, frontmatter: Record<string, any>): Promise<void> {
        const currentContent = await this.app.vault.read(file);
        const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
        const match = currentContent.match(frontmatterRegex);

        if (match) {
            // File has existing frontmatter from Templater - merge it
            const existingFrontmatter = match[1];
            const bodyContent = currentContent.substring(match[0].length);

            // Parse existing frontmatter into an object
            const existingProps: Record<string, any> = {};
            existingFrontmatter.split('\n').forEach(line => {
                const colonIndex = line.indexOf(':');
                if (colonIndex > 0) {
                    const key = line.substring(0, colonIndex).trim();
                    const value = line.substring(colonIndex + 1).trim();
                    existingProps[key] = value;
                }
            });

            // Merge our frontmatter (our values take priority)
            const mergedProps = { ...existingProps, ...frontmatter };

            // Build new frontmatter
            let newFrontmatter = '---\n';
            for (const [key, value] of Object.entries(mergedProps)) {
                if (Array.isArray(value)) {
                    newFrontmatter += `${key}:\n`;
                    value.forEach(v => newFrontmatter += `  - ${v}\n`);
                } else {
                    newFrontmatter += `${key}: ${value}\n`;
                }
            }
            newFrontmatter += '---\n';

            await this.app.vault.modify(file, newFrontmatter + bodyContent);
        } else {
            // No frontmatter in Templater output - add ours at the beginning
            let newFrontmatter = '---\n';
            for (const [key, value] of Object.entries(frontmatter)) {
                if (Array.isArray(value)) {
                    newFrontmatter += `${key}:\n`;
                    value.forEach(v => newFrontmatter += `  - ${v}\n`);
                } else {
                    newFrontmatter += `${key}: ${value}\n`;
                }
            }
            newFrontmatter += '---\n\n';

            await this.app.vault.modify(file, newFrontmatter + currentContent);
        }
    }

    shouldTemplaterProcess(filePath: string): boolean {
        // @ts-ignore - accessing internal plugins API
        const templater = this.app.plugins.plugins['templater-obsidian'];

        if (!templater || !templater._loaded) {
            return false;
        }

        const settings = templater.settings;
        if (!settings?.trigger_on_file_creation || !settings.enable_folder_templates) {
            return false;
        }

        if (!settings.folder_templates || settings.folder_templates.length === 0) {
            return false;
        }

        const normalizedPath = filePath.replace(/\.md$/, '');

        for (const folderTemplate of settings.folder_templates) {
            const folderPath = folderTemplate.folder;
            if (!folderPath) continue;

            // Special case: root folder "/"
            if (folderPath === '/') {
                // File is in root if it doesn't contain any slashes
                const isInRoot = !normalizedPath.includes('/') && !filePath.includes('/');
                if (isInRoot) {
                    return true;
                }
                continue;
            }

            // For non-root folders, check if path starts with the folder
            const matches = (
                normalizedPath.startsWith(folderPath + '/') ||
                normalizedPath === folderPath ||
                filePath.startsWith(folderPath + '/')
            );

            if (matches) {
                return true;
            }
        }

        return false;
    }

    async waitForTemplater(file: TFile): Promise<void> {
        // @ts-ignore - accessing internal plugins API
        const templater = this.app.plugins.plugins['templater-obsidian'];

        if (!templater || !templater._loaded) {
            await new Promise(resolve => setTimeout(resolve, 50));
            return;
        }

        const settings = templater.settings;
        if (!settings?.trigger_on_file_creation) {
            await new Promise(resolve => setTimeout(resolve, 50));
            return;
        }

        const maxWaitTime = 5000;
        const stabilizationTime = 300;

        return new Promise((resolve) => {
            let resolved = false;
            let timeoutId: NodeJS.Timeout;
            let stabilizationTimeoutId: NodeJS.Timeout | null = null;

            const cleanup = () => {
                if (resolved) return;
                resolved = true;
                // @ts-ignore
                this.app.vault.off('modify', modifyHandler);
                if (stabilizationTimeoutId) {
                    clearTimeout(stabilizationTimeoutId);
                }
                clearTimeout(timeoutId);
            };

            const modifyHandler = (modifiedFile: TFile) => {
                if (modifiedFile.path === file.path) {
                    if (stabilizationTimeoutId) {
                        clearTimeout(stabilizationTimeoutId);
                    }

                    stabilizationTimeoutId = setTimeout(() => {
                        cleanup();
                        resolve();
                    }, stabilizationTime);
                }
            };

            // @ts-ignore
            this.app.vault.on('modify', modifyHandler);

            timeoutId = setTimeout(() => {
                cleanup();
                resolve();
            }, maxWaitTime);
        });
    }
}
