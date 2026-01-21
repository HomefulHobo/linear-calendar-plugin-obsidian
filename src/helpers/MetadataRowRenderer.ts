import { App } from 'obsidian';
import { PropertySuggest } from '../PropertySuggest';
import { ValueSuggest } from '../ValueSuggest';
import { TagPillRenderer } from './TagPillRenderer';

export interface MetadataRowConfig {
    entry: { key: string; value: string };
    onKeyChange: (key: string) => Promise<void>;
    onValueChange: (value: string) => Promise<void>;
    onDelete: () => Promise<void>;
    onRefresh?: () => void;
    app: App;
}

export class MetadataRowRenderer {
    static render(container: HTMLElement, config: MetadataRowConfig): void {
        const { entry, onKeyChange, onValueChange, onDelete, onRefresh, app } = config;

        const rowContainer = container.createDiv();
        rowContainer.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 8px;';

        // Property name input
        const keyInput = rowContainer.createEl('input', {
            type: 'text',
            value: entry.key,
            attr: { placeholder: 'Property name' }
        });
        keyInput.style.cssText = 'flex: 0 0 150px; padding: 6px 8px;';
        keyInput.oninput = async () => {
            await onKeyChange(keyInput.value);
            onRefresh?.(); // Re-render to switch between tag pill UI and text input
        };

        // Add property suggestions
        new PropertySuggest(app, keyInput);

        // Colon separator
        rowContainer.createEl('span', { text: ':', attr: { style: 'font-weight: 500;' } });

        // Property value input - use tag pill UI for tags property
        if (entry.key === 'tags') {
            const tags = entry.value ? entry.value.split(/[,\s]+/).map(t => t.replace(/^#/, '').trim()).filter(t => t) : [];
            const tagContainer = rowContainer.createDiv();

            TagPillRenderer.render({
                tags,
                onTagsChange: async (updatedTags) => {
                    await onValueChange(updatedTags.join(', '));
                },
                container: tagContainer,
                app
            });
        } else {
            // Regular text input for other properties
            const valueInput = rowContainer.createEl('input', {
                type: 'text',
                value: entry.value,
                attr: { placeholder: 'Value' }
            });
            valueInput.style.cssText = 'flex: 1; padding: 6px 8px;';
            valueInput.oninput = async () => {
                await onValueChange(valueInput.value);
            };

            // Add value suggestions (based on the current property key)
            new ValueSuggest(app, valueInput, () => entry.key);
        }

        // Delete button
        const deleteBtn = rowContainer.createEl('button', { text: '×' });
        deleteBtn.style.cssText = 'padding: 4px 10px; cursor: pointer; font-size: 1.2em; flex-shrink: 0;';
        deleteBtn.onclick = async () => {
            await onDelete();
        };
    }
}
