import { ItemView, TFile, WorkspaceLeaf, setIcon } from 'obsidian';
import LinearCalendarPlugin from './main';
import { VIEW_TYPE_CALENDAR, NoteInfo, MultiDayEntry, Condition, ColorCategory } from './types';
import { CategoryEditModal } from './SettingsTab';

export class LinearCalendarView extends ItemView {
    plugin: LinearCalendarPlugin;
    private resizeObserver: ResizeObserver | null = null;
    private tooltip: HTMLElement | null = null;
    private dragStartDate: Date | null = null;
    private dragEndDate: Date | null = null;
    private isDragging: boolean = false;
    mouseUpHandler: ((e: MouseEvent) => Promise<void>) | null = null;

    constructor(leaf: WorkspaceLeaf, plugin: LinearCalendarPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return VIEW_TYPE_CALENDAR;
    }

    getDisplayText(): string {
        return "Linear Calendar";
    }

    getIcon(): string {
        return "calendar-range";
    }

    async onOpen(): Promise<void> {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('linear-calendar-container');

        await this.renderCalendar(container as HTMLElement);

        // Add resize listener to recalculate multi-day bar widths
        this.resizeObserver = new ResizeObserver(() => {
            this.updateMultiDayBarWidths(container as HTMLElement);
        });
        this.resizeObserver.observe(container);

        // Add listener for when this view becomes active
        this.registerEvent(
            this.app.workspace.on('active-leaf-change', (leaf) => {
                if (leaf && leaf.view === this) {
                    this.reload();
                }
            })
        );
    }

    async reload(): Promise<void> {
        const container = this.containerEl.children[1] as HTMLElement;
        if (container) {
            container.empty();
            await this.renderCalendar(container);
        }
    }

    updateMultiDayBarWidths(container: HTMLElement): void {
        const bars = container.querySelectorAll<HTMLElement>('.multi-day-bar[data-span]');
        bars.forEach(bar => {
            const span = parseInt(bar.dataset.span || '0');
            const parentCell = bar.parentElement;
            if (parentCell && parentCell.parentElement) {
                const row = parentCell.parentElement;
                const cells = Array.from(row.querySelectorAll('.day-cell'));
                const startIndex = cells.indexOf(parentCell);

                if (startIndex >= 0 && startIndex + span - 1 < cells.length) {
                    const lastCell = cells[startIndex + span - 1] as HTMLElement;

                    const firstCellRect = parentCell.getBoundingClientRect();
                    const lastCellRect = lastCell.getBoundingClientRect();

                    const totalWidth = lastCellRect.right - firstCellRect.left - 6;
                    bar.style.width = `${totalWidth}px`;
                }
            }
        });
    }

    async renderCalendar(container: HTMLElement): Promise<void> {
        const year = this.plugin.settings.currentYear;

        const header = container.createDiv({ cls: 'calendar-header' });

        // Left spacer for centering
        header.createDiv({ cls: 'header-spacer' });

        // Center section with year navigation
        const centerSection = header.createDiv({ cls: 'header-center' });
        const prevBtn = centerSection.createEl('button', { text: '←', cls: 'year-nav-btn' });
        centerSection.createEl('span', { text: `${year}`, cls: 'year-title' });
        const nextBtn = centerSection.createEl('button', { text: '→', cls: 'year-nav-btn' });

        // Right section with Add Note button
        const rightSection = header.createDiv({ cls: 'header-right' });
        if (this.plugin.settings.quickNoteCreation.enabled && this.plugin.settings.quickNoteCreation.showAddNoteButton) {
            const addNoteBtn = rightSection.createEl('button', { cls: 'add-note-btn' });
            addNoteBtn.setAttribute('aria-label', 'Add note');

            // Add calendar-plus icon
            const icon = addNoteBtn.createSpan({ cls: 'add-note-icon' });
            setIcon(icon, 'calendar-plus');

            // Add text label
            addNoteBtn.createSpan({ text: 'Add Note', cls: 'add-note-text' });

            addNoteBtn.onclick = async () => {
                await this.openQuickNoteModal(null, null);
            };
        }

        prevBtn.onclick = async () => {
            this.plugin.settings.currentYear--;
            await this.plugin.saveSettings();
            container.empty();
            await this.renderCalendar(container);
        };

        nextBtn.onclick = async () => {
            this.plugin.settings.currentYear++;
            await this.plugin.saveSettings();
            container.empty();
            await this.renderCalendar(container);
        };

        const notesWithDates = await this.getNotesWithDates();
        const multiDayEntries = this.processMultiDayEntries(notesWithDates);

        // Show welcome banner if user hasn't seen it yet
        if (this.plugin.settings.quickNoteCreation.enabled &&
            !this.plugin.settings.quickNoteCreation.hasSeenWelcomeBanner) {
            this.renderWelcomeBanner(container);
        }

        // Render category index row (if enabled) - between header and calendar
        // Show welcome message if no categories, or chips if categories exist
        if (this.plugin.settings.colorCategories.enabled &&
            this.plugin.settings.colorCategories.showCategoryIndex) {
            this.renderCategoryIndexRow(container);
        }

        const calendarWrapper = container.createDiv({ cls: 'calendar-wrapper' });

        // Apply experimental feature classes
        const exp = this.plugin.settings.experimental;
        if (exp.multilineNotes) {
            calendarWrapper.addClass('exp-multiline');
        }
        if (exp.verticalText) {
            calendarWrapper.addClass('exp-vertical');
        }
        if (exp.compactFontSize) {
            calendarWrapper.addClass('exp-compact');
        }
        if (exp.condensedLetters) {
            calendarWrapper.addClass('exp-condensed');
        }

        // Apply width mode
        if (this.plugin.settings.calendarWidth === 'scrollable') {
            calendarWrapper.addClass('calendar-scrollable');
            calendarWrapper.style.overflowX = 'auto';
        } else {
            calendarWrapper.removeClass('calendar-scrollable');
            calendarWrapper.style.overflowX = '';
        }

        const calendarTable = calendarWrapper.createEl('table', { cls: 'linear-calendar' });

        // Set minimum cell width for scrollable mode
        if (this.plugin.settings.calendarWidth === 'scrollable') {
            calendarTable.style.minWidth = 'max-content';
            calendarTable.style.setProperty('--cell-min-width', `${this.plugin.settings.cellMinWidth}px`);
        } else {
            calendarTable.style.minWidth = '';
            calendarTable.style.removeProperty('--cell-min-width');
        }

        // Add mouse up handler for drag selection
        const handleMouseUp = async (e: MouseEvent) => {
            if (this.isDragging && this.dragStartDate) {
                e.preventDefault();

                // Determine final range
                const endDate = this.dragEndDate || this.dragStartDate;
                const [start, end] = this.dragStartDate <= endDate
                    ? [this.dragStartDate, endDate]
                    : [endDate, this.dragStartDate];

                // Clear visual feedback
                this.clearDragSelection();

                // Open modal with date range
                if (this.plugin.settings.quickNoteCreation.enabled) {
                    await this.openQuickNoteModal(start, start.getTime() === end.getTime() ? null : end);
                }
            }
        };

        // Remove old handler if exists
        if (this.mouseUpHandler) {
            document.removeEventListener('mouseup', this.mouseUpHandler);
        }

        // Store and add new handler
        this.mouseUpHandler = handleMouseUp;
        document.addEventListener('mouseup', handleMouseUp);

        const maxDayCells = 37;

        const thead = calendarTable.createEl('thead');
        const headerRow = thead.createEl('tr');
        headerRow.createEl('th', { cls: 'month-label-cell' });

        // Choose header based on alignment mode
        if (this.plugin.settings.columnAlignment === 'date') {
            // Show date numbers (1-31)
            for (let i = 0; i < 31; i++) {
                headerRow.createEl('th', {
                    text: String(i + 1).padStart(2, '0'),
                    cls: 'weekday-header'
                });
            }
        } else {
            // Show weekdays with adjustable start day
            const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
            const startDay = this.plugin.settings.weekStartDay;
            for (let i = 0; i < maxDayCells; i++) {
                const dayIndex = (i + startDay) % 7;
                headerRow.createEl('th', {
                    text: weekdays[dayIndex],
                    cls: 'weekday-header'
                });
            }
        }
        headerRow.createEl('th', { cls: 'month-label-cell-right' });

        const tbody = calendarTable.createEl('tbody');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const cellsPerRow = this.plugin.settings.columnAlignment === 'date' ? 31 : maxDayCells;

        for (let month = 0; month < 12; month++) {
            await this.renderMonthRow(tbody, year, month, monthNames[month], notesWithDates, multiDayEntries, cellsPerRow);
        }

        const footerRow = calendarTable.createEl('tfoot').createEl('tr');
        footerRow.createEl('td', { cls: 'month-label-cell' });

        // Footer matches header
        if (this.plugin.settings.columnAlignment === 'date') {
            // Show date numbers (1-31)
            for (let i = 0; i < 31; i++) {
                footerRow.createEl('td', {
                    text: String(i + 1).padStart(2, '0'),
                    cls: 'weekday-header'
                });
            }
        } else {
            // Show weekdays with adjustable start day
            const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
            const startDay = this.plugin.settings.weekStartDay;
            for (let i = 0; i < maxDayCells; i++) {
                const dayIndex = (i + startDay) % 7;
                footerRow.createEl('td', {
                    text: weekdays[dayIndex],
                    cls: 'weekday-header'
                });
            }
        }
        footerRow.createEl('td', { cls: 'month-label-cell-right' });
    }

    async getNotesWithDates(): Promise<Map<string, NoteInfo[]>> {
        const notesMap = new Map<string, NoteInfo[]>();
        const files = this.app.vault.getMarkdownFiles();

        for (const file of files) {
            // Check if file passes filter
            if (!this.filePassesFilter(file)) {
                continue;
            }

            // Extract dates
            const dateInfo = await this.extractDateFromFile(file);

            if (dateInfo.startDate && !isNaN(dateInfo.startDate.getTime())) {
                const key = this.dateToKey(dateInfo.startDate);
                if (!notesMap.has(key)) {
                    notesMap.set(key, []);
                }

                const noteInfo: NoteInfo = {
                    file: file,
                    startDate: dateInfo.startDate,
                    endDate: dateInfo.endDate,
                    isMultiDay: !!dateInfo.endDate
                };

                notesMap.get(key)?.push(noteInfo);
            }
        }

        return notesMap;
    }

    filePassesFilter(file: TFile): boolean {
        const { filterMode, filterConditions } = this.plugin.settings;

        if (filterMode === 'none' || filterConditions.length === 0) {
            return true;
        }

        const matchesConditions = filterConditions.every(condition =>
            this.evaluateCondition(file, condition)
        );

        // Include mode: file must match conditions
        // Exclude mode: file must NOT match conditions
        return filterMode === 'include' ? matchesConditions : !matchesConditions;
    }

    evaluateCondition(file: TFile, condition: Condition): boolean {
        const { property, operator, value, includeSubfolders } = condition;

        // Get the actual value to compare
        let actualValue: any;

        if (property === 'file.name') {
            actualValue = file.name;
        } else if (property === 'file.basename') {
            actualValue = file.basename;
        } else if (property === 'file.folder') {
            actualValue = file.parent?.path || '';
        } else if (property === 'file.path') {
            actualValue = file.path;
        } else if (property === 'file.ext') {
            actualValue = file.extension;
        } else if (property === 'file.tags') {
            // Get all tags from the file
            const cache = this.app.metadataCache.getFileCache(file);
            const tags = cache?.tags?.map(t => t.tag.substring(1)) || [];
            const frontmatterTags = cache?.frontmatter?.tags || [];
            actualValue = [...tags, ...frontmatterTags];
        } else if (property.startsWith('property:')) {
            // Custom property
            const propertyName = property.substring(9);
            const cache = this.app.metadataCache.getFileCache(file);
            actualValue = cache?.frontmatter?.[propertyName];
        } else {
            // Assume it's a custom property name
            const cache = this.app.metadataCache.getFileCache(file);
            actualValue = cache?.frontmatter?.[property];
        }

        // Apply operator
        switch (operator) {
            case 'is':
                if (property === 'file.folder' && includeSubfolders) {
                    // For folders with subfolders, check if path starts with the folder
                    const folderPath = value ? value + '/' : '';
                    return file.path.startsWith(folderPath) || file.parent?.path === value;
                }
                return actualValue === value;

            case 'isNot':
                return actualValue !== value;

            case 'contains':
                if (typeof actualValue === 'string') {
                    return actualValue.toLowerCase().includes(value.toLowerCase());
                }
                if (Array.isArray(actualValue)) {
                    return actualValue.some(item =>
                        String(item).toLowerCase().includes(value.toLowerCase())
                    );
                }
                return false;

            case 'doesNotContain':
                if (typeof actualValue === 'string') {
                    return !actualValue.toLowerCase().includes(value.toLowerCase());
                }
                if (Array.isArray(actualValue)) {
                    return !actualValue.some(item =>
                        String(item).toLowerCase().includes(value.toLowerCase())
                    );
                }
                return true;

            case 'startsWith':
                if (typeof actualValue === 'string') {
                    return actualValue.toLowerCase().startsWith(value.toLowerCase());
                }
                return false;

            case 'endsWith':
                if (typeof actualValue === 'string') {
                    return actualValue.toLowerCase().endsWith(value.toLowerCase());
                }
                return false;

            case 'matches':
                // Regex matching
                try {
                    const regex = new RegExp(value);
                    return regex.test(actualValue);
                } catch {
                    return false;
                }

            case 'exists':
                return actualValue !== undefined && actualValue !== null;

            case 'doesNotExist':
                return actualValue === undefined || actualValue === null;

            case 'hasTag':
                const cache = this.app.metadataCache.getFileCache(file);
                const tags = cache?.tags?.map(t => t.tag.substring(1)) || [];
                const frontmatterTags = cache?.frontmatter?.tags || [];
                const allTags = [...tags, ...frontmatterTags];
                return allTags.some(tag => tag.toLowerCase() === value.toLowerCase());

            case 'matchesDatePattern':
                // Special operator for YYYY-MM-DD pattern
                const datePattern = /^(\d{4}-\d{2}-\d{2})/;
                const match = file.basename.match(datePattern);

                if (!match) return false;

                if (condition.requireAdditionalText) {
                    // Must have text after the date
                    return file.basename.length > match[0].length;
                }

                return true;

            default:
                return false;
        }
    }

    /**
     * Get the color category that matches a file.
     * Returns the first enabled category where all conditions match.
     * Returns null if no category matches.
     */
    getCategoryForFile(file: TFile): ColorCategory | null {
        const config = this.plugin.settings.colorCategories;

        for (const category of config.categories) {
            if (!category.enabled) continue;
            if (category.conditions.length === 0) continue;

            const matchMode = category.matchMode || 'all'; // Default to 'all' for backwards compatibility
            const matches = matchMode === 'all'
                ? category.conditions.every(c => this.evaluateCondition(file, c))  // AND logic
                : category.conditions.some(c => this.evaluateCondition(file, c));  // OR logic

            if (matches) return category; // First match wins
        }
        return null;
    }

    /**
     * Get the color to use for a file.
     * Uses category color if file matches a category, otherwise uses default color.
     */
    getColorForFile(file: TFile): string {
        // If color categories are disabled, use theme accent
        if (!this.plugin.settings.colorCategories.enabled) {
            return 'var(--interactive-accent)';
        }

        const category = this.getCategoryForFile(file);
        if (category) return category.color;

        const defaultColor = this.plugin.settings.colorCategories.defaultCategoryColor;
        return defaultColor || 'var(--interactive-accent)';
    }

    /**
     * Get the icon to display for a file.
     * Returns null if global setting is off, or if file doesn't match a category with an icon.
     */
    getIconForFile(file: TFile): { type: 'emoji' | 'lucide', value: string } | null {
        // Check if color categories feature is enabled
        if (!this.plugin.settings.colorCategories.enabled) {
            return null;
        }

        // Check global setting for showing icons
        if (!this.plugin.settings.colorCategories.showIconsInCalendar) {
            return null;
        }

        const category = this.getCategoryForFile(file);
        if (!category || !category.iconType) return null;

        return { type: category.iconType, value: category.iconValue };
    }

    /**
     * Parse a date string (YYYY-MM-DD) as a local date, not UTC.
     * This prevents timezone issues where dates shift to the previous day.
     */
    private parseLocalDate(dateStr: string): Date | null {
        const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (!match) return null;

        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1; // JS months are 0-indexed
        const day = parseInt(match[3], 10);

        const date = new Date(year, month, day);
        return isNaN(date.getTime()) ? null : date;
    }

    async extractDateFromFile(file: TFile): Promise<{ startDate: Date | null; endDate: Date | null }> {
        const config = this.plugin.settings.dateExtraction;
        const result: { startDate: Date | null; endDate: Date | null } = {
            startDate: null,
            endDate: null
        };

        // Extract start date
        const startSources: Array<{ type: 'property' | 'filename', date: Date | null }> = [];

        // Try properties (all of them)
        if (config.startFromProperties.length > 0) {
            for (const propName of config.startFromProperties) {
                const cache = this.app.metadataCache.getFileCache(file);
                const dateStr = cache?.frontmatter?.[propName];
                if (dateStr) {
                    const date = this.parseLocalDate(dateStr);
                    if (date && !isNaN(date.getTime())) {
                        startSources.push({ type: 'property', date });
                        break; // Use first valid property
                    }
                }
            }
        }

        // Try filename
        if (config.startFromFilename) {
            const datePattern = /^(\d{4}-\d{2}-\d{2})/;
            const match = file.basename.match(datePattern);
            if (match) {
                const date = this.parseLocalDate(match[1]);
                if (date && !isNaN(date.getTime())) {
                    startSources.push({ type: 'filename', date });
                }
            }
        }

        // Apply priority
        if (startSources.length > 0) {
            if (startSources.length === 1) {
                result.startDate = startSources[0].date;
            } else {
                // Multiple sources - use priority
                const prioritySource = startSources.find(s => s.type === config.startPriority);
                result.startDate = prioritySource?.date || startSources[0].date;
            }
        }

        // Extract end date
        const endSources: Array<{ type: 'property' | 'filename', date: Date | null }> = [];

        // Try properties (all of them)
        if (config.endFromProperties.length > 0) {
            for (const propName of config.endFromProperties) {
                const cache = this.app.metadataCache.getFileCache(file);
                const dateStr = cache?.frontmatter?.[propName];
                if (dateStr) {
                    const date = this.parseLocalDate(dateStr);
                    if (date && !isNaN(date.getTime())) {
                        endSources.push({ type: 'property', date });
                        break; // Use first valid property
                    }
                }
            }
        }

        // Try filename (second YYYY-MM-DD)
        if (config.endFromFilename) {
            // Find all YYYY-MM-DD patterns in filename
            const datePattern = /\d{4}-\d{2}-\d{2}/g;
            const matches = file.basename.match(datePattern);
            if (matches && matches.length >= 2) {
                // Use second date
                const date = this.parseLocalDate(matches[1]);
                if (date && !isNaN(date.getTime())) {
                    endSources.push({ type: 'filename', date });
                }
            }
        }

        // Apply priority
        if (endSources.length > 0) {
            if (endSources.length === 1) {
                result.endDate = endSources[0].date;
            } else {
                // Multiple sources - use priority
                const prioritySource = endSources.find(s => s.type === config.endPriority);
                result.endDate = prioritySource?.date || endSources[0].date;
            }
        }

        return result;
    }

    processMultiDayEntries(notesMap: Map<string, NoteInfo[]>): Map<string, MultiDayEntry> {
        const multiDayMap = new Map<string, MultiDayEntry>();

        notesMap.forEach((notes) => {
            notes.forEach(noteInfo => {
                if (noteInfo.isMultiDay && noteInfo.endDate && !isNaN(noteInfo.endDate.getTime())) {
                    let currentDate = new Date(noteInfo.startDate);
                    const endDate = new Date(noteInfo.endDate);

                    let monthCount = 0;
                    const maxMonths = 24;

                    while (currentDate <= endDate && monthCount < maxMonths) {
                        const currentMonth = currentDate.getMonth();
                        const currentYear = currentDate.getFullYear();
                        const entryId = `${noteInfo.file.path}-${currentYear}-${currentMonth}`;

                        if (!multiDayMap.has(entryId)) {
                            const segmentStartDay = currentDate.getDate();
                            const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                            let segmentEndDay: number;

                            if (endDate.getFullYear() === currentYear && endDate.getMonth() === currentMonth) {
                                segmentEndDay = endDate.getDate();
                            } else {
                                segmentEndDay = lastDayOfMonth;
                            }

                            multiDayMap.set(entryId, {
                                file: noteInfo.file,
                                startDate: new Date(currentYear, currentMonth, segmentStartDay),
                                endDate: new Date(currentYear, currentMonth, segmentEndDay),
                                month: currentMonth,
                                year: currentYear
                            });
                        }

                        currentDate = new Date(currentYear, currentMonth + 1, 1);
                        monthCount++;
                    }
                }
            });
        });

        return multiDayMap;
    }

    dateToKey(date: Date): string {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    isDailyNote(file: TFile): boolean {
        const format = this.plugin.settings.dailyNoteFormat;
        const basename = file.basename;

        // Convert format to regex pattern
        const pattern = format
            .replace('YYYY', '\\d{4}')
            .replace('MM', '\\d{2}')
            .replace('DD', '\\d{2}');

        const regex = new RegExp(`^${pattern}$`);
        return regex.test(basename);
    }

    hasDateAndText(file: TFile): boolean {
        const datePattern = /^\d{4}-\d{2}-\d{2}/;
        const match = file.basename.match(datePattern);

        if (!match) return false;

        // Check if there's text after the date
        return file.basename.length > match[0].length;
    }

    getDisplayName(file: TFile): string {
        if (!this.plugin.settings.hideDateInTitle) {
            return file.basename;
        }

        // Check if there are multiple dates in the title
        const datePattern = /\d{4}-\d{2}-\d{2}/g;
        const matches = file.basename.match(datePattern);

        // If there are multiple dates, don't hide any of them
        if (matches && matches.length > 1) {
            return file.basename;
        }

        // Remove date portion from the beginning
        const startDatePattern = /^\d{4}-\d{2}-\d{2}\s*/;
        return file.basename.replace(startDatePattern, '').trim() || file.basename;
    }

    shouldShowNote(file: TFile): boolean {
        // Check if it's a daily note
        if (this.isDailyNote(file)) {
            return this.plugin.settings.showDailyNotesInCells;
        }

        // Check if it has date and text
        if (this.hasDateAndText(file)) {
            return this.plugin.settings.showNotesWithDateAndText;
        }

        // Show all other notes
        return true;
    }

    getDailyNoteFolder(): string {
        if (this.plugin.settings.dailyNoteFolderMode === 'obsidian') {
            const dailyNotesPlugin = (this.app as any).internalPlugins?.plugins?.['daily-notes'];

            if (dailyNotesPlugin && dailyNotesPlugin.enabled) {
                let folder = dailyNotesPlugin.instance?.options?.folder || '';
                folder = folder.replace(/^\/+|\/+$/g, '');
                return folder ? folder + '/' : '';
            }
            return '';
        } else {
            const folder = this.plugin.settings.dailyNoteCustomFolder;
            return folder ? folder + '/' : '';
        }
    }

    async findDailyNoteInFolder(filename: string, folderPath: string): Promise<TFile | null> {
        const files = this.app.vault.getMarkdownFiles();

        for (const file of files) {
            if (file.path.startsWith(folderPath) && file.name === filename) {
                return file;
            }
        }

        return null;
    }

    formatDateForDailyNote(date: Date): string {
        const format = this.plugin.settings.dailyNoteFormat;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return format
            .replace('YYYY', String(year))
            .replace('MM', month)
            .replace('DD', day);
    }

    async openOrCreateDailyNote(date: Date): Promise<void> {
        const filename = this.formatDateForDailyNote(date);
        const folderPath = this.getDailyNoteFolder();

        // Try to find existing daily note first
        const existingFile = await this.findDailyNoteInFolder(`${filename}.md`, folderPath);

        if (existingFile) {
            await this.app.workspace.getLeaf(false).openFile(existingFile);
        } else {
            const fullPath = `${folderPath}${filename}.md`;

            // Get template content and process variables for the target date
            const templateContent = await this.getDailyNoteTemplateContent(date, filename);

            // Create file with processed template content
            const newFile = await this.app.vault.create(fullPath, templateContent);

            // Open the file - this will trigger Templater if it's configured to run on file creation
            await this.app.workspace.getLeaf(false).openFile(newFile);
        }
    }

    async getDailyNoteTemplateContent(date: Date, filename: string): Promise<string> {
        const dailyNotesPlugin = (this.app as any).internalPlugins?.plugins?.['daily-notes'];

        if (!dailyNotesPlugin || !dailyNotesPlugin.enabled) {
            return '';
        }

        const templatePath = dailyNotesPlugin.instance?.options?.template;
        if (!templatePath) {
            return '';
        }

        // Find the template file
        const templateFile = this.app.vault.getAbstractFileByPath(templatePath + '.md')
            || this.app.vault.getAbstractFileByPath(templatePath);

        if (templateFile instanceof TFile) {
            const rawContent = await this.app.vault.read(templateFile);
            // Process template variables for the target date
            return this.processTemplateVariables(rawContent, date, filename);
        }

        return '';
    }

    processTemplateVariables(content: string, date: Date, filename: string): string {
        const moment = (window as any).moment;
        const targetMoment = moment(date);
        const format = this.plugin.settings.dailyNoteFormat;

        // Process {{date}} and {{date:FORMAT}} patterns
        content = content.replace(/\{\{date(?::([^}]+))?\}\}/g, (_, customFormat) => {
            return targetMoment.format(customFormat || format);
        });

        // Process {{time}} and {{time:FORMAT}} patterns
        content = content.replace(/\{\{time(?::([^}]+))?\}\}/g, (_, customFormat) => {
            return targetMoment.format(customFormat || 'HH:mm');
        });

        // Process {{title}} - the filename without extension
        content = content.replace(/\{\{title\}\}/g, filename);

        // Process {{yesterday}} and {{yesterday:FORMAT}}
        content = content.replace(/\{\{yesterday(?::([^}]+))?\}\}/g, (_, customFormat) => {
            return targetMoment.clone().subtract(1, 'day').format(customFormat || format);
        });

        // Process {{tomorrow}} and {{tomorrow:FORMAT}}
        content = content.replace(/\{\{tomorrow(?::([^}]+))?\}\}/g, (_, customFormat) => {
            return targetMoment.clone().add(1, 'day').format(customFormat || format);
        });

        return content;
    }

    async openQuickNoteModal(startDate: Date | null, endDate: Date | null = null): Promise<void> {
        const { QuickNoteModal } = await import('./QuickNoteModal');
        new QuickNoteModal(
            this.app,
            this.plugin,
            startDate,
            endDate
        ).open();
    }

    highlightDateRange(startDate: Date, endDate: Date): void {
        // Ensure startDate is before endDate
        const [start, end] = startDate <= endDate
            ? [startDate, endDate]
            : [endDate, startDate];

        // Find all day numbers and highlight those in range
        const dayNumbers = this.containerEl.querySelectorAll('.day-number');
        dayNumbers.forEach((el: Element) => {
            const htmlEl = el as HTMLElement;
            const dateStr = htmlEl.dataset.date;
            if (!dateStr) return;

            const cellDate = new Date(dateStr);
            if (cellDate >= start && cellDate <= end) {
                htmlEl.addClass('drag-selecting');
            }
        });
    }

    clearDragSelection(): void {
        this.containerEl.querySelectorAll('.drag-selecting').forEach((el: Element) => {
            (el as HTMLElement).removeClass('drag-selecting');
        });
        this.dragStartDate = null;
        this.dragEndDate = null;
        this.isDragging = false;
    }

    /**
     * Render the category index as a standalone section between header and calendar.
     * Shows all enabled categories as clickable chips, or a welcome message if no categories exist.
     */
    renderWelcomeBanner(container: HTMLElement): void {
        const banner = container.createDiv({ cls: 'quick-note-welcome-banner' });
        banner.style.cssText = `
            background: var(--background-secondary);
            padding: 16px 20px;
            border-radius: 8px;
            margin-top: 16px;
            margin-bottom: 16px;
            border: 2px solid var(--interactive-accent);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
        `;

        const contentWrapper = banner.createDiv();
        contentWrapper.style.cssText = 'flex: 1;';

        const title = contentWrapper.createEl('div', { text: '🦈✨ Get Faster' });
        title.style.cssText = 'font-weight: 600; font-size: 1.05em; margin-bottom: 8px;';

        const message = contentWrapper.createEl('div');
        message.style.cssText = 'color: var(--text-muted); font-size: 0.95em; line-height: 1.5;';
        message.innerHTML = `
            <strong>Click "Add Note"</strong> above to create a new note, or<br>
            <strong>Cmd/Ctrl+Click on any day</strong> number to create a dated note instantly<br>
            <strong>Cmd/Ctrl+Click and drag</strong> across days to create a multi-day note<br>
            ⚙️ <strong>Configure</strong> your preferred default behavior in this plugin's settings
        `;

        const closeBtn = banner.createEl('button', { text: '×' });
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: var(--text-muted);
            font-size: 24px;
            line-height: 1;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            flex-shrink: 0;
        `;
        closeBtn.setAttribute('aria-label', 'Dismiss banner');
        closeBtn.onmouseenter = () => {
            closeBtn.style.background = 'var(--background-modifier-hover)';
        };
        closeBtn.onmouseleave = () => {
            closeBtn.style.background = 'none';
        };
        closeBtn.onclick = async () => {
            this.plugin.settings.quickNoteCreation.hasSeenWelcomeBanner = true;
            await this.plugin.saveSettings();
            banner.remove();
        };
    }

    renderCategoryIndexRow(container: HTMLElement): void {
        const config = this.plugin.settings.colorCategories;

        // Create a standalone div for the category index
        const categoryIndexDiv = container.createDiv({ cls: 'category-index-section' });

        // If no categories exist, show welcome message
        if (config.categories.length === 0) {
            const welcomeContainer = categoryIndexDiv.createDiv({ cls: 'categories-container' });
            welcomeContainer.style.cssText = 'flex-direction: column; gap: 12px; align-items: center;';

            const welcomeText = welcomeContainer.createEl('div', { text: 'Add color to your year! ✨🦈' });
            welcomeText.style.cssText = 'font-size: 1.1em; font-weight: 500;';

            const hideHint = welcomeContainer.createEl('div', { text: 'Hide this section by disabling Color Categories in the settings.' });
            hideHint.style.cssText = 'font-size: 0.9em; color: var(--text-muted); margin-top: 4px;';

            const addBtn = welcomeContainer.createEl('button', { text: '+ Add category' });
            addBtn.style.cssText = 'padding: 6px 16px; cursor: pointer; margin-top: 8px;';
            addBtn.onclick = async () => {
                const newCategory: ColorCategory = {
                    id: Date.now().toString(),
                    name: 'New Category',
                    color: '#6366f1',
                    iconType: null,
                    iconValue: '',
                    conditions: [],
                    matchMode: 'all',
                    enabled: true
                };
                config.categories.push(newCategory);
                await this.plugin.saveSettings();
                new CategoryEditModal(
                    this.app,
                    this.plugin,
                    newCategory,
                    () => this.reload()
                ).open();
            };
            return;
        }

        // Container for category chips
        const chipsContainer = categoryIndexDiv.createDiv({ cls: 'categories-container' });

        // Render each enabled category as a chip
        config.categories.forEach(category => {
            if (!category.enabled) return;

            const chip = chipsContainer.createDiv({ cls: 'category-chip' });
            chip.style.background = category.color;
            chip.style.color = '#ffffff'; // White text for contrast

            // Add icon if exists and global setting is on
            if (category.iconType && category.iconValue && config.showIconsInCalendar) {
                const iconEl = chip.createEl('span', { cls: 'category-chip-icon' });
                if (category.iconType === 'emoji') {
                    iconEl.textContent = category.iconValue;
                } else {
                    setIcon(iconEl, category.iconValue);
                    iconEl.style.color = '#ffffff';
                }
            }

            // Category name
            chip.createEl('span', {
                text: category.name,
                cls: 'category-chip-name'
            });

            // Click to open category edit modal
            chip.style.cursor = 'pointer';
            chip.onclick = () => {
                new CategoryEditModal(
                    this.app,
                    this.plugin,
                    category,
                    () => this.reload()  // Refresh calendar when category is edited
                ).open();
            };

            // Hover effect
            chip.addEventListener('mouseenter', () => {
                chip.style.opacity = '0.8';
            });
            chip.addEventListener('mouseleave', () => {
                chip.style.opacity = '1';
            });
        });

        // Add + button to create new category
        const addBtn = chipsContainer.createDiv({ cls: 'category-chip category-add-btn' });
        addBtn.style.cssText = 'background: var(--interactive-accent); color: #ffffff; cursor: pointer; font-weight: 600;';
        addBtn.textContent = '+';
        addBtn.onclick = async () => {
            const newCategory: ColorCategory = {
                id: Date.now().toString(),
                name: 'New Category',
                color: '#6366f1',
                iconType: null,
                iconValue: '',
                conditions: [],
                matchMode: 'all',
                enabled: true
            };
            config.categories.push(newCategory);
            await this.plugin.saveSettings();
            new CategoryEditModal(
                this.app,
                this.plugin,
                newCategory,
                () => this.reload()
            ).open();
        };
        addBtn.addEventListener('mouseenter', () => {
            addBtn.style.opacity = '0.8';
        });
        addBtn.addEventListener('mouseleave', () => {
            addBtn.style.opacity = '1';
        });
    }

    async renderMonthRow(
        tbody: HTMLTableSectionElement,
        year: number,
        month: number,
        monthName: string,
        notesMap: Map<string, NoteInfo[]>,
        multiDayEntries: Map<string, MultiDayEntry>,
        maxDayCells: number
    ): Promise<void> {
        const row = tbody.createEl('tr', { cls: 'month-row' });

        row.createEl('td', { text: monthName, cls: 'month-label' });

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        // Determine offset based on alignment mode
        // For 'weekday' mode: adjust offset based on week start day
        // For 'date' mode: no offset, day 1 always in column 0
        const useWeekdayAlignment = this.plugin.settings.columnAlignment === 'weekday';
        let columnOffset = 0;
        if (useWeekdayAlignment) {
            const weekStartDay = this.plugin.settings.weekStartDay;
            // Calculate offset: how many columns from the configured week start
            columnOffset = (startingDayOfWeek - weekStartDay + 7) % 7;
        }

        const dayCells: HTMLElement[] = [];

        const activeMultiDayEntries: MultiDayEntry[] = [];

        multiDayEntries.forEach((entry) => {
            if (entry.month === month && entry.year === year && this.shouldShowNote(entry.file)) {
                activeMultiDayEntries.push(entry);
            }
        });

        const occupiedRows: { row: number; start: number; end: number }[] = [];
        const barPositions = new Map<string, { rowIndex: number; startCol: number; endCol: number; span: number }>();

        activeMultiDayEntries.forEach((entry) => {
            const startDay = entry.startDate.getDate();
            const endDay = entry.endDate.getDate();

            const startCol = columnOffset + startDay - 1;
            const endCol = columnOffset + endDay - 1;
            const span = endCol - startCol + 1;

            if (span <= 0) return;

            let rowIndex = 0;
            while (occupiedRows.some(occupied =>
                occupied.row === rowIndex &&
                occupied.start < endCol + 1 &&
                occupied.end > startCol
            )) {
                rowIndex++;
            }

            occupiedRows.push({ row: rowIndex, start: startCol, end: endCol + 1 });
            barPositions.set(entry.file.path + '-' + entry.month, { rowIndex, startCol, endCol, span });
        });

        const maxBarRow = occupiedRows.length > 0 ? Math.max(...occupiedRows.map(o => o.row)) : -1;
        const topPadding = (maxBarRow + 1) * 16 + 18;

        // Add empty cells for alignment (only in weekday mode)
        for (let i = 0; i < columnOffset; i++) {
            const emptyCell = row.createEl('td', { cls: 'day-cell empty' });
            dayCells.push(emptyCell);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = this.dateToKey(date);
            const dayCell = row.createEl('td', { cls: 'day-cell' });

            const dayIndex = columnOffset + day - 1;
            const barsAbove = occupiedRows.filter(o => o.start <= dayIndex && o.end > dayIndex).length;
            if (barsAbove > 0) {
                dayCell.style.paddingTop = `${topPadding}px`;
            }

            dayCells.push(dayCell);

            const dayNumber = dayCell.createEl('a', {
                text: String(day).padStart(2, '0'),
                cls: 'day-number day-number-link'
            });

            // Store date in dataset for easy access
            dayNumber.dataset.date = date.toISOString();

            // Click handler - check for modifier key
            dayNumber.onclick = async (e) => {
                e.preventDefault();

                // Check if Cmd (Mac) or Ctrl (Windows/Linux) is pressed
                if (e.metaKey || e.ctrlKey) {
                    // Quick note creation
                    if (this.plugin.settings.quickNoteCreation.enabled) {
                        await this.openQuickNoteModal(date);
                    }
                } else {
                    // Regular daily note open/create
                    await this.openOrCreateDailyNote(date);
                }
            };

            // Mouse down handler - start drag selection
            dayNumber.onmousedown = (e) => {
                if (e.metaKey || e.ctrlKey) {
                    e.preventDefault();
                    this.dragStartDate = date;
                    this.dragEndDate = null;
                    this.isDragging = true;

                    // Add visual feedback
                    dayNumber.addClass('drag-selecting');
                }
            };

            // Mouse enter handler - update drag selection
            dayNumber.onmouseenter = () => {
                if (this.isDragging && this.dragStartDate) {
                    // Clear previous selection highlights
                    this.containerEl.querySelectorAll('.drag-selecting').forEach((el: Element) => {
                        (el as HTMLElement).removeClass('drag-selecting');
                    });

                    // Highlight all days in range
                    this.dragEndDate = date;
                    this.highlightDateRange(this.dragStartDate, this.dragEndDate);
                }
            };

            const notes = notesMap.get(dateKey);
            if (notes && notes.length > 0) {
                const notesContainer = dayCell.createDiv({ cls: 'day-notes' });

                const singleDayNotes = notes.filter(n => !n.isMultiDay && this.shouldShowNote(n.file));

                singleDayNotes.forEach(noteInfo => {
                    const noteLink = notesContainer.createEl('a', {
                        cls: 'note-link internal-link',
                        href: '#'
                    });

                    // Apply color
                    noteLink.style.background = this.getColorForFile(noteInfo.file);

                    // Add icon if exists
                    const icon = this.getIconForFile(noteInfo.file);
                    if (icon) {
                        const iconSpan = noteLink.createEl('span', { cls: 'note-icon' });
                        iconSpan.style.cssText = 'margin-right: 3px;';
                        if (icon.type === 'emoji') {
                            iconSpan.textContent = icon.value;
                        } else {
                            setIcon(iconSpan, icon.value);
                            iconSpan.style.color = '#ffffff';
                        }
                    }

                    // Add title
                    noteLink.createEl('span', { text: this.getDisplayName(noteInfo.file) });

                    noteLink.setAttr('data-href', noteInfo.file.path);

                    // Custom tooltip on mouseenter
                    noteLink.addEventListener('mouseenter', (event) => {
                        this.showTooltip(noteInfo.file.basename, event);
                    });

                    noteLink.addEventListener('mouseleave', () => {
                        this.hideTooltip();
                    });

                    noteLink.addEventListener('mouseover', (event) => {
                        this.app.workspace.trigger('hover-link', {
                            event,
                            source: VIEW_TYPE_CALENDAR,
                            hoverParent: this,
                            targetEl: noteLink,
                            linktext: noteInfo.file.path
                        });
                    });

                    noteLink.onclick = (e) => {
                        e.preventDefault();
                        this.app.workspace.getLeaf(false).openFile(noteInfo.file);
                    };
                });
            }

            if (date.getTime() === today.getTime()) {
                dayCell.addClass('today');
            }
        }

        const cellsUsed = columnOffset + daysInMonth;
        const remainingCells = maxDayCells - cellsUsed;
        for (let i = 0; i < remainingCells; i++) {
            const emptyCell = row.createEl('td', { cls: 'day-cell empty' });
            dayCells.push(emptyCell);
        }

        // Create multi-day bars
        activeMultiDayEntries.forEach((entry) => {
            const pos = barPositions.get(entry.file.path + '-' + entry.month);
            if (!pos) return;

            const firstDayCell = dayCells[pos.startCol];
            if (firstDayCell && firstDayCell.classList.contains('day-cell')) {
                const multiDayBar = firstDayCell.createEl('div', {
                    cls: 'multi-day-bar'
                });

                // Apply color to bar
                multiDayBar.style.background = this.getColorForFile(entry.file);
                multiDayBar.style.top = `${20 + (pos.rowIndex * 16)}px`;
                multiDayBar.dataset.span = pos.span.toString();

                const noteLink = multiDayBar.createEl('a', {
                    cls: 'multi-day-link internal-link',
                    href: '#'
                });

                // Add icon if exists
                const icon = this.getIconForFile(entry.file);
                if (icon) {
                    const iconSpan = noteLink.createEl('span', { cls: 'note-icon' });
                    iconSpan.style.cssText = 'margin-right: 3px;';
                    if (icon.type === 'emoji') {
                        iconSpan.textContent = icon.value;
                    } else {
                        setIcon(iconSpan, icon.value);
                        iconSpan.style.color = '#ffffff';
                    }
                }

                // Add title
                noteLink.createEl('span', { text: this.getDisplayName(entry.file) });

                noteLink.setAttr('data-href', entry.file.path);

                // Custom tooltip on mouseenter
                noteLink.addEventListener('mouseenter', (event) => {
                    this.showTooltip(entry.file.basename, event);
                });

                noteLink.addEventListener('mouseleave', () => {
                    this.hideTooltip();
                });

                noteLink.addEventListener('mouseover', (event) => {
                    this.app.workspace.trigger('hover-link', {
                        event,
                        source: VIEW_TYPE_CALENDAR,
                        hoverParent: this,
                        targetEl: noteLink,
                        linktext: entry.file.path
                    });
                });

                noteLink.onclick = (e) => {
                    e.preventDefault();
                    this.app.workspace.getLeaf(false).openFile(entry.file);
                };

                // Set width after DOM is rendered
                setTimeout(() => {
                    if (firstDayCell && firstDayCell.parentElement) {
                        const row = firstDayCell.parentElement;
                        const cells = Array.from(row.querySelectorAll('.day-cell'));
                        const startIndex = cells.indexOf(firstDayCell);

                        if (startIndex >= 0 && startIndex + pos.span - 1 < cells.length) {
                            const lastCell = cells[startIndex + pos.span - 1] as HTMLElement;

                            const firstCellRect = firstDayCell.getBoundingClientRect();
                            const lastCellRect = lastCell.getBoundingClientRect();

                            const totalWidth = lastCellRect.right - firstCellRect.left - 6;
                            multiDayBar.style.width = `${totalWidth}px`;
                        }
                    }
                }, 0);
            }
        });

        row.createEl('td', { text: monthName, cls: 'month-label-right' });
    }

    async onClose(): Promise<void> {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        this.hideTooltip();
    }

    private showTooltip(text: string, event: MouseEvent): void {
        this.hideTooltip();

        this.tooltip = document.body.createEl('div', {
            cls: 'lc-tooltip',
            text: text
        });

        // Position tooltip near the cursor
        const x = event.clientX + 10;
        const y = event.clientY + 10;

        this.tooltip.style.left = `${x}px`;
        this.tooltip.style.top = `${y}px`;
    }

    private hideTooltip(): void {
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }
    }
}
