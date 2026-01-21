import { App } from 'obsidian';
import { BaseSuggest, SuggestItem } from './helpers/BaseSuggest';

/**
 * Property name suggester for text inputs
 * Provides autocomplete functionality for property names from vault
 */
export class PropertySuggest extends BaseSuggest {
    getSuggestions(query: string): SuggestItem[] {
        const properties = this.getAllProperties();
        return properties
            .filter(prop => prop.toLowerCase().includes(query))
            .slice(0, 20)
            .map(prop => ({ value: prop }));
    }

    private getAllProperties(): string[] {
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
}
