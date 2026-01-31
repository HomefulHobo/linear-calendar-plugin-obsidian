import { App } from 'obsidian';
import { Condition } from '../types';
import { TagPillRenderer } from './TagPillRenderer';
import { PropertySuggest } from '../PropertySuggest';
import { ValueSuggest } from '../ValueSuggest';
import { FolderSuggest } from '../FolderSuggest';

export interface ConditionCallbacks {
    onSave: () => Promise<void>;
    onRefresh?: () => void;
}

// Helper function to get valid operators for a property type
function getValidOperators(property: string): { value: string, label: string }[] {
    if (property === 'file.tags') {
        return [
            { value: 'contains', label: 'contains' },
            { value: 'doesNotContain', label: 'does not contain' },
            { value: 'exists', label: 'exists' },
            { value: 'doesNotExist', label: 'does not exist' }
        ];
    } else if (property === 'file.folder') {
        return [
            { value: 'is', label: 'is' },
            { value: 'isNot', label: 'is not' },
            { value: 'contains', label: 'contains' },
            { value: 'doesNotContain', label: 'does not contain' }
        ];
    } else if (property === 'file.name' || property === 'file.basename') {
        return [
            { value: 'is', label: 'is' },
            { value: 'isNot', label: 'is not' },
            { value: 'contains', label: 'contains' },
            { value: 'doesNotContain', label: 'does not contain' },
            { value: 'exists', label: 'exists' },
            { value: 'doesNotExist', label: 'does not exist' },
            { value: 'matchesDatePattern', label: 'matches date pattern' }
        ];
    } else {
        return [
            { value: 'is', label: 'is' },
            { value: 'isNot', label: 'is not' },
            { value: 'contains', label: 'contains' },
            { value: 'doesNotContain', label: 'does not contain' },
            { value: 'exists', label: 'exists' },
            { value: 'doesNotExist', label: 'does not exist' }
        ];
    }
}

export class ConditionRenderer {
    static render(
        container: HTMLElement,
        condition: Condition,
        condIndex: number,
        conditions: Condition[],
        app: App,
        callbacks: ConditionCallbacks
    ): void {
        const condEl = container.createDiv();
        condEl.style.cssText = 'display: flex; gap: 5px; align-items: flex-start; margin-bottom: 10px; flex-wrap: wrap; padding: 10px; background: var(--background-primary); border-radius: 3px; border: 1px solid var(--background-modifier-border);';

        const fieldsContainer = condEl.createDiv();
        fieldsContainer.style.cssText = 'display: flex; gap: 5px; flex-wrap: wrap; flex: 1; align-items: center;';

        // Property selector
        this.renderPropertySelector(fieldsContainer, condition, callbacks);

        // Custom property input (if needed)
        this.renderCustomPropertyInput(fieldsContainer, condition, app, callbacks);

        // Operator selector
        this.renderOperatorSelector(fieldsContainer, condition, callbacks);

        // Value input (context-aware)
        this.renderValueInput(fieldsContainer, condition, app, callbacks);

        // Conditional checkboxes (subfolders, additional text, etc.)
        this.renderConditionalCheckboxes(fieldsContainer, condition, callbacks);

        // Delete button
        this.renderDeleteButton(condEl, conditions, condIndex, callbacks);
    }

    private static renderPropertySelector(
        container: HTMLElement,
        condition: Condition,
        callbacks: ConditionCallbacks
    ): void {
        const properties = [
            { value: 'file.folder', label: 'Folder' },
            { value: 'file.tags', label: 'Tags' },
            { value: 'file.name', label: 'File Name' },
            { value: 'file.basename', label: 'File Basename' },
            { value: 'file.ext', label: 'Extension' },
            { value: 'file.path', label: 'Path' },
            { value: 'custom', label: 'Custom property' }
        ];

        const propertySelect = container.createEl('select');
        propertySelect.style.cssText = 'padding: 4px 8px;';

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
                condition.property = 'category';
            } else {
                condition.property = (e.target as HTMLSelectElement).value;
            }
            await callbacks.onSave();
            callbacks.onRefresh?.();
        };
    }

    private static renderCustomPropertyInput(
        container: HTMLElement,
        condition: Condition,
        app: App,
        callbacks: ConditionCallbacks
    ): void {
        const properties = [
            { value: 'file.folder', label: 'Folder' },
            { value: 'file.tags', label: 'Tags' },
            { value: 'file.name', label: 'File Name' },
            { value: 'file.basename', label: 'File Basename' },
            { value: 'file.ext', label: 'Extension' },
            { value: 'file.path', label: 'Path' },
            { value: 'custom', label: 'Custom property' }
        ];

        const needsCustomInput = !properties.find(p => p.value === condition.property);

        if (needsCustomInput) {
            const customInput = container.createEl('input', {
                type: 'text',
                attr: { placeholder: 'property name' },
                value: condition.property
            });
            customInput.style.cssText = 'padding: 4px 8px; width: 120px;';
            customInput.onchange = async (e) => {
                condition.property = (e.target as HTMLInputElement).value;
                await callbacks.onSave();
            };

            new PropertySuggest(app, customInput);
        }
    }

    private static renderOperatorSelector(
        container: HTMLElement,
        condition: Condition,
        callbacks: ConditionCallbacks
    ): void {
        const operatorSelect = container.createEl('select');
        operatorSelect.style.cssText = 'padding: 4px 8px;';
        const operators = getValidOperators(condition.property);

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
            await callbacks.onSave();
            callbacks.onRefresh?.();
        };
    }

    private static renderValueInput(
        container: HTMLElement,
        condition: Condition,
        app: App,
        callbacks: ConditionCallbacks
    ): void {
        if (['exists', 'doesNotExist'].includes(condition.operator)) {
            return; // No value input needed
        }

        // Special handling for matchesDatePattern - format input
        if (condition.operator === 'matchesDatePattern') {
            const formatInput = container.createEl('input', {
                type: 'text',
                attr: { placeholder: 'YYYY-MM-DD' },
                value: condition.value || 'YYYY-MM-DD'
            });
            formatInput.style.cssText = 'padding: 4px 8px; flex: 1; min-width: 150px;';
            formatInput.onchange = async (e) => {
                condition.value = (e.target as HTMLInputElement).value;
                await callbacks.onSave();
            };
            return;
        }

        // Special handling for file.tags - use tag pill UI
        if (condition.property === 'file.tags') {
            const tags = condition.value ? condition.value.split(',').map(t => t.trim()).filter(t => t) : [];
            const tagContainer = container.createDiv();

            TagPillRenderer.render({
                tags,
                onTagsChange: async (updatedTags) => {
                    condition.value = updatedTags.join(', ');
                    await callbacks.onSave();
                },
                container: tagContainer,
                app
            });
        } else {
            // Regular text input for other properties
            const valueInput = container.createEl('input', {
                type: 'text',
                attr: { placeholder: 'value' },
                value: condition.value || ''
            });
            valueInput.style.cssText = 'padding: 4px 8px; flex: 1; min-width: 120px;';
            valueInput.onchange = async (e) => {
                condition.value = (e.target as HTMLInputElement).value;
                await callbacks.onSave();
            };

            // Attach appropriate suggest based on property type
            if (condition.property === 'file.folder') {
                new FolderSuggest(app, valueInput);
            } else {
                new ValueSuggest(app, valueInput, () => condition.property);
            }
        }
    }

    private static renderConditionalCheckboxes(
        container: HTMLElement,
        condition: Condition,
        callbacks: ConditionCallbacks
    ): void {
        // Include subfolders checkbox for folder property
        if (condition.property === 'file.folder' && condition.operator === 'is') {
            const subfolderLabel = container.createEl('label');
            subfolderLabel.style.cssText = 'display: flex; align-items: center; gap: 5px;';
            const subfolderCheckbox = subfolderLabel.createEl('input', { type: 'checkbox' });
            subfolderCheckbox.checked = condition.includeSubfolders || false;
            subfolderCheckbox.onchange = async (e) => {
                condition.includeSubfolders = (e.target as HTMLInputElement).checked;
                await callbacks.onSave();
            };
            subfolderLabel.createEl('span', { text: 'Include subfolders' });
        }

        // Require additional text checkbox for matchesDatePattern operator
        if (condition.operator === 'matchesDatePattern') {
            const additionalTextLabel = container.createEl('label');
            additionalTextLabel.style.cssText = 'display: flex; align-items: center; gap: 5px;';
            const additionalTextCheckbox = additionalTextLabel.createEl('input', { type: 'checkbox' });
            additionalTextCheckbox.checked = condition.requireAdditionalText || false;
            additionalTextCheckbox.onchange = async (e) => {
                condition.requireAdditionalText = (e.target as HTMLInputElement).checked;
                await callbacks.onSave();
            };
            additionalTextLabel.createEl('span', { text: 'And contains additional text' });
        }
    }

    private static renderDeleteButton(
        container: HTMLElement,
        conditions: Condition[],
        condIndex: number,
        callbacks: ConditionCallbacks
    ): void {
        const deleteBtn = container.createEl('button', { text: '×' });
        deleteBtn.style.cssText = 'padding: 2px 8px; cursor: pointer; font-size: 1.2em; background: transparent; border: none;';
        deleteBtn.onclick = async () => {
            conditions.splice(condIndex, 1);
            await callbacks.onSave();
            callbacks.onRefresh?.();
        };
    }
}
