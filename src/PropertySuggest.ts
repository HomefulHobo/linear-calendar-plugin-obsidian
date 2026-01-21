import { App } from 'obsidian';

/**
 * Property name suggester for text inputs
 * Provides autocomplete functionality for property names from vault
 */
export class PropertySuggest {
    app: App;
    inputEl: HTMLInputElement;
    suggestions: HTMLElement | null = null;

    constructor(app: App, inputEl: HTMLInputElement) {
        this.app = app;
        this.inputEl = inputEl;

        this.inputEl.addEventListener('input', () => this.updateSuggestions());
        this.inputEl.addEventListener('focus', () => this.updateSuggestions());
        this.inputEl.addEventListener('blur', () => {
            setTimeout(() => this.closeSuggestions(), 200);
        });
    }

    getAllProperties(): string[] {
        const properties = new Set<string>();
        const files = this.app.vault.getMarkdownFiles();

        files.forEach(file => {
            const cache = this.app.metadataCache.getFileCache(file);
            if (cache?.frontmatter) {
                Object.keys(cache.frontmatter).forEach(key => {
                    if (key !== 'position') { // Exclude internal properties
                        properties.add(key);
                    }
                });
            }
        });

        return Array.from(properties).sort();
    }

    updateSuggestions(): void {
        const query = this.inputEl.value.toLowerCase();
        const allProperties = this.getAllProperties();
        const matches = allProperties
            .filter(prop => prop.toLowerCase().includes(query))
            .slice(0, 20);

        this.showSuggestions(matches);
    }

    showSuggestions(properties: string[]): void {
        this.closeSuggestions();

        if (properties.length === 0) return;

        this.suggestions = document.createElement('div');
        this.suggestions.className = 'suggestion-container';
        this.suggestions.style.cssText = 'position: absolute; background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 4px; padding: 4px; z-index: 1000; max-height: 300px; overflow-y: auto;';

        properties.forEach(property => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = property;
            item.style.cssText = 'padding: 6px 12px; cursor: pointer; border-radius: 3px;';
            item.addEventListener('mouseenter', () => {
                item.style.background = 'var(--background-modifier-hover)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = '';
            });
            item.addEventListener('click', () => {
                this.inputEl.value = property;
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
