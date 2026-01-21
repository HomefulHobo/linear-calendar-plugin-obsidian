import { App } from 'obsidian';

/**
 * Tag suggester for text inputs
 * Provides autocomplete functionality for tags from vault
 */
export class TagSuggest {
    app: App;
    inputEl: HTMLInputElement;
    suggestions: HTMLElement | null = null;
    onSelect: ((tag: string) => void) | null = null;

    constructor(app: App, inputEl: HTMLInputElement) {
        this.app = app;
        this.inputEl = inputEl;

        this.inputEl.addEventListener('input', () => this.updateSuggestions());
        this.inputEl.addEventListener('focus', () => this.updateSuggestions());
        this.inputEl.addEventListener('blur', () => {
            setTimeout(() => this.closeSuggestions(), 200);
        });
    }

    getAllTags(): string[] {
        const tags = new Set<string>();
        const files = this.app.vault.getMarkdownFiles();

        files.forEach(file => {
            const cache = this.app.metadataCache.getFileCache(file);

            // Get tags from frontmatter
            if (cache?.frontmatter?.tags) {
                const frontmatterTags = cache.frontmatter.tags;
                if (Array.isArray(frontmatterTags)) {
                    frontmatterTags.forEach(t => {
                        const tag = String(t).replace(/^#/, '').trim();
                        if (tag) tags.add(tag);
                    });
                } else {
                    const tag = String(frontmatterTags).replace(/^#/, '').trim();
                    if (tag) tags.add(tag);
                }
            }

            // Get tags from content
            if (cache?.tags) {
                cache.tags.forEach(tagCache => {
                    const tag = tagCache.tag.replace(/^#/, '').trim();
                    if (tag) tags.add(tag);
                });
            }
        });

        return Array.from(tags).sort();
    }

    updateSuggestions(): void {
        const query = this.inputEl.value.toLowerCase();
        const allTags = this.getAllTags();
        const matches = allTags
            .filter(tag => tag.toLowerCase().includes(query))
            .slice(0, 20);

        this.showSuggestions(matches);
    }

    showSuggestions(tags: string[]): void {
        this.closeSuggestions();

        if (tags.length === 0) return;

        this.suggestions = document.createElement('div');
        this.suggestions.className = 'suggestion-container';
        this.suggestions.style.cssText = 'position: absolute; background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 4px; padding: 4px; z-index: 1000; max-height: 300px; overflow-y: auto;';

        tags.forEach(tag => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = tag;
            item.style.cssText = 'padding: 6px 12px; cursor: pointer; border-radius: 3px;';
            item.addEventListener('mouseenter', () => {
                item.style.background = 'var(--background-modifier-hover)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = '';
            });
            item.addEventListener('click', () => {
                if (this.onSelect) {
                    // If custom callback is set, use it
                    this.onSelect(tag);
                    this.inputEl.value = '';
                } else {
                    // Default behavior: set input value
                    this.inputEl.value = tag;
                    this.inputEl.dispatchEvent(new Event('input'));
                }
                this.closeSuggestions();
                this.inputEl.focus();
            });
            this.suggestions?.appendChild(item);
        });

        const rect = this.inputEl.getBoundingClientRect();
        this.suggestions.style.top = (rect.bottom + 2) + 'px';
        this.suggestions.style.left = rect.left + 'px';
        this.suggestions.style.width = rect.width + 'px';

        document.body.appendChild(this.suggestions);
    }

    closeSuggestions(): void {
        if (this.suggestions) {
            this.suggestions.remove();
            this.suggestions = null;
        }
    }
}
