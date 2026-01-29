import { App, TFile, TFolder } from 'obsidian';
import { BaseSuggest, SuggestItem } from './helpers/BaseSuggest';

/**
 * File path suggester for text inputs
 * Can optionally filter to files within a specific folder
 */
export class FileSuggest extends BaseSuggest {
    private baseFolderPath: string | null;
    private extension: string;

    constructor(app: App, inputEl: HTMLInputElement, baseFolderPath?: string, extension: string = 'md') {
        super(app, inputEl);
        this.baseFolderPath = baseFolderPath || null;
        this.extension = extension;
    }

    getSuggestions(query: string): SuggestItem[] {
        const files = this.getFiles();
        return files
            .filter(file => file.toLowerCase().includes(query))
            .slice(0, 15)
            .map(file => ({ value: file }));
    }

    private getFiles(): string[] {
        const files: string[] = [];

        // Determine the starting folder
        let startFolder: TFolder | null = null;
        if (this.baseFolderPath) {
            const folder = this.app.vault.getAbstractFileByPath(this.baseFolderPath);
            if (folder instanceof TFolder) {
                startFolder = folder;
            }
        }

        // If no valid base folder, search entire vault
        if (!startFolder) {
            startFolder = this.app.vault.getRoot();
        }

        const recurse = (folder: TFolder) => {
            if (folder.children) {
                for (const child of folder.children) {
                    if (child instanceof TFile && child.extension === this.extension) {
                        // Return path without extension for cleaner display
                        files.push(child.path.replace(new RegExp(`\\.${this.extension}$`), ''));
                    } else if (child instanceof TFolder) {
                        recurse(child);
                    }
                }
            }
        };
        recurse(startFolder);
        return files.sort();
    }

    /**
     * Update the base folder path (useful if the folder setting changes)
     */
    setBaseFolderPath(path: string | null): void {
        this.baseFolderPath = path;
    }
}
