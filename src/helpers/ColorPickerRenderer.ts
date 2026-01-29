import { setIcon } from 'obsidian';
import { ColorPalette } from '../types';

export interface ColorPickerConfig {
    container: HTMLElement;
    currentColor: string;
    palettes: ColorPalette[];
    onColorChange: (color: string) => Promise<void>;
}

/**
 * Reusable color picker with palette support.
 * Renders a color input, hex display, and optional palette button.
 */
export class ColorPickerRenderer {
    static render(config: ColorPickerConfig): void {
        const { container, currentColor, palettes, onColorChange } = config;

        container.empty();

        // Main container
        const colorPickerContainer = container.createDiv();
        colorPickerContainer.style.cssText = 'display: flex; align-items: center; gap: 8px;';

        // Color input
        const colorInput = colorPickerContainer.createEl('input', { type: 'color', value: currentColor });
        colorInput.style.cssText = 'width: 60px; height: 32px; cursor: pointer; border-radius: 4px;';

        // Hex display
        const hexDisplay = colorPickerContainer.createEl('code');
        hexDisplay.textContent = currentColor.toUpperCase();
        hexDisplay.style.cssText = 'color: var(--text-muted); font-size: 0.9em;';

        // Update hex display on color input change
        colorInput.oninput = () => {
            hexDisplay.textContent = colorInput.value.toUpperCase();
        };

        colorInput.onchange = async (e) => {
            const newColor = (e.target as HTMLInputElement).value;
            hexDisplay.textContent = newColor.toUpperCase();
            await onColorChange(newColor);
        };

        // Palette button (only if palettes exist)
        if (palettes && palettes.length > 0) {
            const paletteBtn = colorPickerContainer.createEl('button');
            paletteBtn.style.cssText = 'padding: 4px 10px; cursor: pointer; font-size: 1.1em; border: 1px solid var(--background-modifier-border); background: var(--background-secondary); border-radius: 4px; white-space: nowrap; line-height: 1; display: flex; align-items: center; justify-content: center;';
            setIcon(paletteBtn, 'palette');
            paletteBtn.title = 'Open Color Palettes';

            let popover: HTMLElement | null = null;

            const closePopover = () => {
                if (popover) {
                    popover.remove();
                    popover = null;
                }
            };

            paletteBtn.onclick = (e) => {
                e.preventDefault();

                if (popover) {
                    closePopover();
                    return;
                }

                popover = document.body.createDiv();
                popover.style.cssText = 'position: fixed; z-index: 1000; background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 6px; padding: 12px; padding-top: 8px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3); max-width: 280px; max-height: 400px; overflow-y: auto;';

                // Close button
                const closeBtn = popover.createEl('button');
                closeBtn.textContent = '×';
                closeBtn.style.cssText = 'position: absolute; top: 4px; right: 4px; width: 24px; height: 24px; border: none; background: transparent; cursor: pointer; font-size: 1.4em; line-height: 1; padding: 0; color: var(--text-muted); border-radius: 3px;';
                closeBtn.title = 'Close';
                closeBtn.onmouseenter = () => { closeBtn.style.background = 'var(--background-modifier-hover)'; };
                closeBtn.onmouseleave = () => { closeBtn.style.background = 'transparent'; };
                closeBtn.onclick = (e) => { e.preventDefault(); closePopover(); };

                // Position near button
                const btnRect = paletteBtn.getBoundingClientRect();
                popover.style.top = (btnRect.bottom + 6) + 'px';
                popover.style.left = btnRect.left + 'px';

                // Adjust if off-screen
                setTimeout(() => {
                    if (popover) {
                        const popoverRect = popover.getBoundingClientRect();
                        if (popoverRect.right > window.innerWidth) {
                            popover.style.left = (window.innerWidth - popoverRect.width - 10) + 'px';
                        }
                        if (popoverRect.bottom > window.innerHeight) {
                            popover.style.top = (btnRect.top - popoverRect.height - 6) + 'px';
                        }
                    }
                }, 0);

                // Render palettes
                palettes.forEach((palette, idx) => {
                    const paletteSection = popover!.createDiv();
                    paletteSection.style.cssText = idx > 0 ? 'margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--background-modifier-border);' : 'margin-top: 4px;';

                    const paletteName = paletteSection.createEl('div', { text: palette.name });
                    paletteName.style.cssText = 'font-size: 0.85em; color: var(--text-muted); margin-bottom: 8px; font-weight: 500;';

                    const swatchesGrid = paletteSection.createDiv();
                    swatchesGrid.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;';

                    palette.colors.forEach(colorEntry => {
                        const swatch = swatchesGrid.createEl('button');
                        const isSelected = colorInput.value.toLowerCase() === colorEntry.hex.toLowerCase();
                        swatch.style.cssText = `width: 100%; aspect-ratio: 1; border-radius: 4px; border: 2px solid ${isSelected ? 'var(--interactive-accent)' : 'var(--background-modifier-border)'}; background: ${colorEntry.hex}; cursor: pointer; padding: 0; transition: all 0.15s;`;
                        swatch.title = `${colorEntry.name}\n${colorEntry.hex}`;
                        swatch.onclick = async (e) => {
                            e.preventDefault();
                            colorInput.value = colorEntry.hex;
                            hexDisplay.textContent = colorEntry.hex.toUpperCase();
                            await onColorChange(colorEntry.hex);
                            closePopover();
                        };
                        swatch.onmouseenter = () => {
                            swatch.style.transform = 'scale(1.08)';
                            swatch.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
                        };
                        swatch.onmouseleave = () => {
                            swatch.style.transform = 'scale(1)';
                            swatch.style.boxShadow = 'none';
                        };
                    });
                });

                // Close on click outside
                const clickHandler = (e: MouseEvent) => {
                    if (popover && !popover.contains(e.target as Node) && !paletteBtn.contains(e.target as Node)) {
                        closePopover();
                        document.removeEventListener('click', clickHandler);
                    }
                };
                setTimeout(() => { document.addEventListener('click', clickHandler); }, 0);

                // Close on Escape key
                const keyHandler = (e: KeyboardEvent) => {
                    if (e.key === 'Escape' && popover) {
                        closePopover();
                        document.removeEventListener('keydown', keyHandler);
                    }
                };
                document.addEventListener('keydown', keyHandler);
            };
        }
    }
}
