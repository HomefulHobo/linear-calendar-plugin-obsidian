import { App } from 'obsidian';
import { TagSuggest } from '../TagSuggest';

export interface TagPillConfig {
    tags: string[];
    onTagsChange: (tags: string[]) => Promise<void>;
    container: HTMLElement;
    app: App;
}

export class TagPillRenderer {
    static render(config: TagPillConfig): void {
        const { tags, onTagsChange, container, app } = config;

        container.empty();
        container.style.cssText = 'display: flex; flex-wrap: wrap; gap: 4px; align-items: center; flex: 1; min-width: 120px; padding: 4px 8px; border: 1px solid var(--background-modifier-border); border-radius: 3px; background: var(--background-primary);';

        // Render existing tag chips
        tags.forEach((tag, index) => {
            const chip = container.createEl('span');
            chip.style.cssText = 'display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: var(--interactive-accent); color: var(--text-on-accent); border-radius: 12px; font-size: 0.9em;';
            chip.createEl('span', { text: tag });

            const removeBtn = chip.createEl('span', { text: '×' });
            removeBtn.style.cssText = 'cursor: pointer; font-weight: bold;';
            removeBtn.onclick = async () => {
                tags.splice(index, 1);
                await onTagsChange(tags);
                TagPillRenderer.render(config);
            };
        });

        // Add input for new tags
        const tagInput = container.createEl('input', {
            type: 'text',
            attr: { placeholder: 'Add tag...' }
        });
        tagInput.style.cssText = 'flex: 1; min-width: 80px; border: none; outline: none; background: transparent; padding: 2px 4px;';

        // Attach TagSuggest with custom callback
        const tagSuggest = new TagSuggest(app, tagInput);
        tagSuggest.onSelect = async (tag: string) => {
            const newTag = tag.replace(/^#/, '').trim();
            if (newTag && !tags.includes(newTag)) {
                tags.push(newTag);
                await onTagsChange(tags);
                TagPillRenderer.render(config);
            }
        };

        // Keyboard handlers
        tagInput.onkeydown = async (e) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const newTag = tagInput.value.replace(/^#/, '').trim();
                if (newTag && !tags.includes(newTag)) {
                    tags.push(newTag);
                    await onTagsChange(tags);
                    tagInput.value = '';
                    TagPillRenderer.render(config);
                }
            } else if (e.key === 'Backspace' && tagInput.value === '' && tags.length > 0) {
                tags.pop();
                await onTagsChange(tags);
                TagPillRenderer.render(config);
            }
        };

        setTimeout(() => tagInput.focus(), 0);
    }
}
