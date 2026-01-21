import { App } from 'obsidian';

/**
 * Property value suggester for text inputs
 * Provides autocomplete functionality for property values based on the property key
 */
export class ValueSuggest {
    app: App;
    inputEl: HTMLInputElement;
    getPropertyKey: () => string;
    suggestions: HTMLElement | null = null;

    constructor(app: App, inputEl: HTMLInputElement, getPropertyKey: () => string) {
        this.app = app;
        this.inputEl = inputEl;
        this.getPropertyKey = getPropertyKey;

        this.inputEl.addEventListener('input', () => this.updateSuggestions());
        this.inputEl.addEventListener('focus', () => this.updateSuggestions());
        this.inputEl.addEventListener('blur', () => {
            setTimeout(() => this.closeSuggestions(), 200);
        });
    }

    getAllValuesForProperty(propertyKey: string): string[] {
        if (!propertyKey) return [];

        const values = new Set<string>();
        const files = this.app.vault.getMarkdownFiles();

        files.forEach(file => {
            const cache = this.app.metadataCache.getFileCache(file);
            if (cache?.frontmatter && cache.frontmatter[propertyKey]) {
                const value = cache.frontmatter[propertyKey];
                if (Array.isArray(value)) {
                    value.forEach(v => values.add(String(v)));
                } else {
                    values.add(String(value));
                }
            }
        });

        return Array.from(values).sort();
    }

    updateSuggestions(): void {
        const propertyKey = this.getPropertyKey();
        if (!propertyKey) {
            this.closeSuggestions();
            return;
        }

        const query = this.inputEl.value.toLowerCase();
        const allValues = this.getAllValuesForProperty(propertyKey);
        const matches = allValues
            .filter(val => val.toLowerCase().includes(query))
            .slice(0, 20);

        this.showSuggestions(matches);
    }

    showSuggestions(values: string[]): void {
        this.closeSuggestions();

        if (values.length === 0) return;

        this.suggestions = document.createElement('div');
        this.suggestions.className = 'suggestion-container';
        this.suggestions.style.cssText = 'position: absolute; background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 4px; padding: 4px; z-index: 1000; max-height: 300px; overflow-y: auto;';

        values.forEach(value => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = value;
            item.style.cssText = 'padding: 6px 12px; cursor: pointer; border-radius: 3px;';
            item.addEventListener('mouseenter', () => {
                item.style.background = 'var(--background-modifier-hover)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = '';
            });
            item.addEventListener('click', () => {
                this.inputEl.value = value;
                this.inputEl.dispatchEvent(new Event('input'));
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
