import { App, TFolder } from 'obsidian';

/**
 * Simple folder suggester for text inputs
 * Provides autocomplete functionality for folder paths
 */
export class FolderSuggest {
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

    getAllFolders(): string[] {
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

    updateSuggestions(): void {
        const query = this.inputEl.value.toLowerCase();
        const allFolders = this.getAllFolders();
        const matches = allFolders
            .filter(folder => folder.toLowerCase().includes(query))
            .slice(0, 10);

        this.showSuggestions(matches);
    }

    showSuggestions(folders: string[]): void {
        this.closeSuggestions();

        if (folders.length === 0) return;

        this.suggestions = document.createElement('div');
        this.suggestions.className = 'suggestion-container';
        this.suggestions.style.cssText = 'position: absolute; background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 4px; padding: 4px; z-index: 1000; max-height: 200px; overflow-y: auto;';

        folders.forEach(folder => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = folder;
            item.style.cssText = 'padding: 4px 8px; cursor: pointer; border-radius: 3px;';
            item.addEventListener('mouseenter', () => {
                item.style.background = 'var(--background-modifier-hover)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = '';
            });
            item.addEventListener('click', () => {
                this.inputEl.value = folder;
                this.inputEl.dispatchEvent(new Event('input'));
                this.closeSuggestions();
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
