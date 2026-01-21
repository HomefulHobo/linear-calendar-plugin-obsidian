import { BaseSuggest, SuggestItem } from './helpers/BaseSuggest';

/**
 * Tag suggester for text inputs
 * Provides autocomplete functionality for tags from vault
 */
export class TagSuggest extends BaseSuggest {
    onSelect: ((tag: string) => void) | null = null;

    getSuggestions(query: string): SuggestItem[] {
        const tags = this.getAllTags();
        return tags
            .filter(tag => tag.toLowerCase().includes(query))
            .slice(0, 20)
            .map(tag => ({ value: tag }));
    }

    selectItem(item: SuggestItem): void {
        if (this.onSelect) {
            this.onSelect(item.value);
            this.inputEl.value = '';
        } else {
            super.selectItem(item);
        }
    }

    private getAllTags(): string[] {
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
}
