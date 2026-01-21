import { TFolder } from 'obsidian';
import { BaseSuggest, SuggestItem } from './helpers/BaseSuggest';

/**
 * Simple folder suggester for text inputs
 * Provides autocomplete functionality for folder paths
 */
export class FolderSuggest extends BaseSuggest {
    getSuggestions(query: string): SuggestItem[] {
        const folders = this.getAllFolders();
        return folders
            .filter(folder => folder.toLowerCase().includes(query))
            .slice(0, 10)
            .map(folder => ({ value: folder }));
    }

    private getAllFolders(): string[] {
        const folders: string[] = [];
        const recurse = (folder: TFolder) => {
            if (folder.path) folders.push(folder.path);
            if (folder.children) {
                for (const child of folder.children) {
                    if (child instanceof TFolder) {
                        recurse(child);
                    }
                }
            }
        };
        recurse(this.app.vault.getRoot());
        return folders;
    }
}
