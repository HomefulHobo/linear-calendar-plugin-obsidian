import { App } from 'obsidian';
import { BaseSuggest, SuggestItem } from './helpers/BaseSuggest';

/**
 * Property value suggester for text inputs
 * Provides autocomplete functionality for property values based on the property key
 */
export class ValueSuggest extends BaseSuggest {
    getPropertyKey: () => string;

    constructor(app: App, inputEl: HTMLInputElement, getPropertyKey: () => string) {
        super(app, inputEl);
        this.getPropertyKey = getPropertyKey;
    }

    getSuggestions(query: string): SuggestItem[] {
        const propertyKey = this.getPropertyKey();
        if (!propertyKey) return [];

        const values = this.getAllValuesForProperty(propertyKey);
        return values
            .filter(val => val.toLowerCase().includes(query))
            .slice(0, 20)
            .map(val => ({ value: val }));
    }

    private getAllValuesForProperty(propertyKey: string): string[] {
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
}
