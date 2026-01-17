import { ItemView, TFile, WorkspaceLeaf } from 'obsidian';
import LinearCalendarPlugin from './main';
import { VIEW_TYPE_CALENDAR, NoteInfo, MultiDayEntry, Condition } from './types';

export class LinearCalendarView extends ItemView {
    plugin: LinearCalendarPlugin;
    private resizeObserver: ResizeObserver | null = null;
    private tooltip: HTMLElement | null = null;

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
        return "calendar";
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
        const prevBtn = header.createEl('button', { text: '←', cls: 'year-nav-btn' });
        header.createEl('span', { text: `${year}`, cls: 'year-title' });
        const nextBtn = header.createEl('button', { text: '→', cls: 'year-nav-btn' });

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

        const maxDayCells = 37;

        const headerRow = calendarTable.createEl('thead').createEl('tr');
        headerRow.createEl('th', { cls: 'month-label-cell' });

        const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        for (let i = 0; i < maxDayCells; i++) {
            headerRow.createEl('th', {
                text: weekdays[i % 7],
                cls: 'weekday-header'
            });
        }
        headerRow.createEl('th', { cls: 'month-label-cell-right' });

        const tbody = calendarTable.createEl('tbody');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for (let month = 0; month < 12; month++) {
            await this.renderMonthRow(tbody, year, month, monthNames[month], notesWithDates, multiDayEntries, maxDayCells);
        }

        const footerRow = calendarTable.createEl('tfoot').createEl('tr');
        footerRow.createEl('td', { cls: 'month-label-cell' });
        for (let i = 0; i < maxDayCells; i++) {
            footerRow.createEl('td', {
                text: weekdays[i % 7],
                cls: 'weekday-header'
            });
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
                return false;

            case 'doesNotContain':
                if (typeof actualValue === 'string') {
                    return !actualValue.toLowerCase().includes(value.toLowerCase());
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
                    const date = new Date(dateStr);
                    if (!isNaN(date.getTime())) {
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
                const date = new Date(match[1]);
                if (!isNaN(date.getTime())) {
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
                    const date = new Date(dateStr);
                    if (!isNaN(date.getTime())) {
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
                const date = new Date(matches[1]);
                if (!isNaN(date.getTime())) {
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

        const existingFile = await this.findDailyNoteInFolder(`${filename}.md`, folderPath);

        if (existingFile) {
            await this.app.workspace.getLeaf(false).openFile(existingFile);
        } else {
            const fullPath = `${folderPath}${filename}.md`;
            const newFile = await this.app.vault.create(fullPath, '');
            await this.app.workspace.getLeaf(false).openFile(newFile);
        }
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

            const startCol = startingDayOfWeek + startDay - 1;
            const endCol = startingDayOfWeek + endDay - 1;
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

        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyCell = row.createEl('td', { cls: 'day-cell empty' });
            dayCells.push(emptyCell);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = this.dateToKey(date);
            const dayCell = row.createEl('td', { cls: 'day-cell' });

            const dayIndex = startingDayOfWeek + day - 1;
            const barsAbove = occupiedRows.filter(o => o.start <= dayIndex && o.end > dayIndex).length;
            if (barsAbove > 0) {
                dayCell.style.paddingTop = `${topPadding}px`;
            }

            dayCells.push(dayCell);

            const dayNumber = dayCell.createEl('a', {
                text: String(day).padStart(2, '0'),
                cls: 'day-number day-number-link'
            });

            dayNumber.onclick = async (e) => {
                e.preventDefault();
                await this.openOrCreateDailyNote(date);
            };

            const notes = notesMap.get(dateKey);
            if (notes && notes.length > 0) {
                const notesContainer = dayCell.createDiv({ cls: 'day-notes' });

                const singleDayNotes = notes.filter(n => !n.isMultiDay && this.shouldShowNote(n.file));

                singleDayNotes.forEach(noteInfo => {
                    const noteLink = notesContainer.createEl('a', {
                        text: this.getDisplayName(noteInfo.file),
                        cls: 'note-link internal-link',
                        href: '#'
                    });

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

        const cellsUsed = startingDayOfWeek + daysInMonth;
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

                multiDayBar.style.top = `${20 + (pos.rowIndex * 16)}px`;
                multiDayBar.dataset.span = pos.span.toString();

                const noteLink = multiDayBar.createEl('a', {
                    text: this.getDisplayName(entry.file),
                    cls: 'multi-day-link internal-link',
                    href: '#'
                });

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
