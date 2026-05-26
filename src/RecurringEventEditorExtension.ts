import { App, TFile, setIcon } from 'obsidian';
import { EditorView, ViewPlugin, WidgetType, Decoration, DecorationSet, ViewUpdate } from '@codemirror/view';
import { Extension, RangeSetBuilder } from '@codemirror/state';
import LinearCalendarPlugin from './main';

class RRuleEditWidget extends WidgetType {
    constructor(
        private app: App,
        private filePath: string,
        private plugin: LinearCalendarPlugin
    ) { super(); }

    toDOM(): HTMLElement {
        const btn = document.createElement('span');
        btn.className = 'lc-rrule-edit-btn';
        btn.setAttribute('aria-label', 'Edit recurring rule');
        btn.style.cssText = 'cursor: pointer; margin-left: 6px; opacity: 0.6; vertical-align: middle; display: inline-flex; align-items: center;';
        setIcon(btn, 'square-pen');
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const file = this.app.vault.getAbstractFileByPath(this.filePath);
            if (file instanceof TFile) {
                this.plugin.openRecurringRuleBuilder(file);
            }
        });
        return btn;
    }

    eq(other: RRuleEditWidget): boolean {
        return other.filePath === this.filePath;
    }

    ignoreEvent(): boolean { return false; }
}

export function buildRecurringEditorExtension(plugin: LinearCalendarPlugin): Extension {
    return ViewPlugin.fromClass(
        class {
            decorations: DecorationSet;

            constructor(view: EditorView) {
                this.decorations = this.buildDecorations(view);
            }

            update(update: ViewUpdate) {
                if (update.docChanged || update.viewportChanged || update.focusChanged) {
                    this.decorations = this.buildDecorations(update.view);
                }
            }

            buildDecorations(view: EditorView): DecorationSet {
                const config = plugin.settings.recurringEvents;
                if (!config.enabled || config.propertyRules.length === 0) {
                    return Decoration.none;
                }

                const file = plugin.app.workspace.getActiveFile();
                if (!file) return Decoration.none;

                const builder = new RangeSetBuilder<Decoration>();
                const doc = view.state.doc;
                const docText = doc.toString();

                // Only process if document has frontmatter
                if (!docText.startsWith('---')) return Decoration.none;

                // Find end of frontmatter
                const fmEnd = docText.indexOf('\n---', 3);
                if (fmEnd === -1) return Decoration.none;

                const propertyNames = new Set(config.propertyRules.map(r => r.propertyName));

                // Scan lines within frontmatter
                for (let lineNum = 1; lineNum <= doc.lines; lineNum++) {
                    const line = doc.line(lineNum);
                    if (line.from > fmEnd + 4) break; // past frontmatter

                    const text = line.text;
                    const colonIdx = text.indexOf(':');
                    if (colonIdx < 1) continue;

                    const key = text.slice(0, colonIdx).trim();
                    if (!propertyNames.has(key)) continue;

                    const lineEnd = line.to;
                    builder.add(
                        lineEnd,
                        lineEnd,
                        Decoration.widget({
                            widget: new RRuleEditWidget(plugin.app, file.path, plugin),
                            side: 1
                        })
                    );
                }

                return builder.finish();
            }
        },
        { decorations: (v) => v.decorations }
    );
}
