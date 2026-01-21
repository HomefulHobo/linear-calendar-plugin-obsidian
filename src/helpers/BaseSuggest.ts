import { App } from 'obsidian';

export interface SuggestItem {
    value: string;
    label?: string;
}

export abstract class BaseSuggest {
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

    abstract getSuggestions(query: string): SuggestItem[];

    updateSuggestions(): void {
        const query = this.inputEl.value.toLowerCase();
        const items = this.getSuggestions(query);
        this.showSuggestions(items);
    }

    showSuggestions(items: SuggestItem[]): void {
        this.closeSuggestions();

        if (items.length === 0) return;

        this.suggestions = document.createElement('div');
        this.suggestions.className = 'suggestion-container';
        this.suggestions.style.cssText = 'position: absolute; background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 4px; padding: 4px; z-index: 1000; max-height: 300px; overflow-y: auto;';

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.textContent = item.label || item.value;
            div.style.cssText = 'padding: 6px 12px; cursor: pointer; border-radius: 3px;';

            div.addEventListener('mouseenter', () => {
                div.style.background = 'var(--background-modifier-hover)';
            });
            div.addEventListener('mouseleave', () => {
                div.style.background = '';
            });
            div.addEventListener('click', () => {
                this.selectItem(item);
            });

            this.suggestions?.appendChild(div);
        });

        const rect = this.inputEl.getBoundingClientRect();
        this.suggestions.style.top = (rect.bottom + 2) + 'px';
        this.suggestions.style.left = rect.left + 'px';
        this.suggestions.style.width = rect.width + 'px';

        document.body.appendChild(this.suggestions);
    }

    selectItem(item: SuggestItem): void {
        this.inputEl.value = item.value;
        this.inputEl.dispatchEvent(new Event('input'));
        this.inputEl.dispatchEvent(new Event('change'));
        this.closeSuggestions();
        this.inputEl.focus();
    }

    closeSuggestions(): void {
        if (this.suggestions) {
            this.suggestions.remove();
            this.suggestions = null;
        }
    }
}
