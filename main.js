'use strict';

var obsidian = require('obsidian');

const DEFAULT_SETTINGS = {
    dateProperty: 'lincal_date',
    endDateProperty: 'lincal_date_end',
    currentYear: new Date().getFullYear(),
    dailyNoteFormat: 'YYYY-MM-DD',
    dailyNoteFolderMode: 'obsidian', // 'obsidian' or 'custom'
    dailyNoteCustomFolder: ''
};

const VIEW_TYPE_CALENDAR = "linear-calendar-view";

class LinearCalendarView extends obsidian.ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType() {
        return VIEW_TYPE_CALENDAR;
    }

    getDisplayText() {
        return "Linear Calendar";
    }

    getIcon() {
        return "calendar";
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('linear-calendar-container');
        
        await this.renderCalendar(container);
        
        // Add resize listener to recalculate multi-day bar widths
        this.resizeObserver = new ResizeObserver(() => {
            this.updateMultiDayBarWidths(container);
        });
        this.resizeObserver.observe(container);
    }
    
    updateMultiDayBarWidths(container) {
        const bars = container.querySelectorAll('.multi-day-bar[data-span]');
        bars.forEach(bar => {
            const span = parseInt(bar.dataset.span);
            const parentCell = bar.parentElement;
            if (parentCell && parentCell.parentElement) {
                // Get all day cells in this row
                const row = parentCell.parentElement;
                const cells = Array.from(row.querySelectorAll('.day-cell'));
                const startIndex = cells.indexOf(parentCell);
                
                if (startIndex >= 0 && startIndex + span - 1 < cells.length) {
                    const lastCell = cells[startIndex + span - 1];
                    
                    // Calculate actual width from first cell to last cell
                    const firstCellRect = parentCell.getBoundingClientRect();
                    const lastCellRect = lastCell.getBoundingClientRect();
                    
                    // Width = (right edge of last cell) - (left edge of first cell) - offset - padding
                    const totalWidth = lastCellRect.right - firstCellRect.left - 6;
                    bar.style.width = `${totalWidth}px`;
                }
            }
        });
    }

    async renderCalendar(container) {
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
        const multiDayEntries = this.processMultiDayEntries(notesWithDates, year);
        
        const calendarWrapper = container.createDiv({ cls: 'calendar-wrapper' });
        const calendarTable = calendarWrapper.createEl('table', { cls: 'linear-calendar' });

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

    async getNotesWithDates() {
        const notesMap = new Map();
        const files = this.app.vault.getMarkdownFiles();

        for (const file of files) {
            const cache = this.app.metadataCache.getFileCache(file);
            const frontmatter = cache?.frontmatter;

            if (frontmatter) {
                const dateStr = frontmatter[this.plugin.settings.dateProperty];
                const endDateStr = frontmatter[this.plugin.settings.endDateProperty];

                if (dateStr) {
                    const startDate = new Date(dateStr);
                    if (!isNaN(startDate.getTime())) {
                        const key = this.dateToKey(startDate);
                        if (!notesMap.has(key)) {
                            notesMap.set(key, []);
                        }
                        
                        const noteInfo = {
                            file: file,
                            startDate: startDate,
                            endDate: endDateStr ? new Date(endDateStr) : null,
                            isMultiDay: !!endDateStr
                        };
                        
                        notesMap.get(key)?.push(noteInfo);
                    }
                }
            }
        }

        return notesMap;
    }

    processMultiDayEntries(notesMap, year) {
        const multiDayMap = new Map();
        
        notesMap.forEach((notes, dateKey) => {
            notes.forEach(noteInfo => {
                if (noteInfo.isMultiDay && noteInfo.endDate && !isNaN(noteInfo.endDate.getTime())) {
                    // Create entries for each month this event spans
                    let currentDate = new Date(noteInfo.startDate);
                    const endDate = new Date(noteInfo.endDate);
                    
                    // Safety limit to prevent infinite loops
                    let monthCount = 0;
                    const maxMonths = 24; // Max 2 years span
                    
                    while (currentDate <= endDate && monthCount < maxMonths) {
                        const currentMonth = currentDate.getMonth();
                        const currentYear = currentDate.getFullYear();
                        const entryId = `${noteInfo.file.path}-${currentYear}-${currentMonth}`;
                        
                        if (!multiDayMap.has(entryId)) {
                            // Determine start day for this month segment
                            const segmentStartDay = currentDate.getDate();
                            
                            // End is either the end of the month or the actual end date
                            const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                            let segmentEndDay;
                            
                            if (endDate.getFullYear() === currentYear && endDate.getMonth() === currentMonth) {
                                // End date is in this month
                                segmentEndDay = endDate.getDate();
                            } else {
                                // End date is in a later month, so go to end of this month
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
                        
                        // Move to first day of next month
                        currentDate = new Date(currentYear, currentMonth + 1, 1);
                        monthCount++;
                    }
                }
            });
        });
        
        return multiDayMap;
    }

    dateToKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    getDailyNoteFolder() {
        if (this.plugin.settings.dailyNoteFolderMode === 'obsidian') {
            // Use Obsidian's daily notes plugin settings
            const dailyNotesPlugin = this.app.internalPlugins?.plugins?.['daily-notes'];
            
            if (dailyNotesPlugin && dailyNotesPlugin.enabled) {
                let folder = dailyNotesPlugin.instance?.options?.folder || '';
                // Remove leading and trailing slashes, then add trailing slash
                folder = folder.replace(/^\/+|\/+$/g, '');
                return folder ? folder + '/' : '';
            }
            return '';
        } else {
            // Use custom folder
            const folder = this.plugin.settings.dailyNoteCustomFolder;
            return folder ? folder + '/' : '';
        }
    }

    async findDailyNoteInFolder(filename, folderPath) {
        // Search in the specified folder and its subfolders
        const files = this.app.vault.getMarkdownFiles();
        
        for (const file of files) {
            // Check if file is in the folder or subfolder
            if (file.path.startsWith(folderPath) && file.name === filename) {
                return file;
            }
        }
        
        return null;
    }

    formatDateForDailyNote(date) {
        const format = this.plugin.settings.dailyNoteFormat;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return format
            .replace('YYYY', String(year))
            .replace('MM', month)
            .replace('DD', day);
    }

    async openOrCreateDailyNote(date) {
        const filename = this.formatDateForDailyNote(date);
        const folderPath = this.getDailyNoteFolder();
        
        // Try to find existing note in folder
        const existingFile = await this.findDailyNoteInFolder(`${filename}.md`, folderPath);
        
        if (existingFile) {
            await this.app.workspace.getLeaf(false).openFile(existingFile);
        } else {
            // Create new note in the specified folder
            const fullPath = `${folderPath}${filename}.md`;
            const newFile = await this.app.vault.create(fullPath, '');
            await this.app.workspace.getLeaf(false).openFile(newFile);
        }
    }

    async renderMonthRow(tbody, year, month, monthName, notesMap, multiDayEntries, maxDayCells) {
        const row = tbody.createEl('tr', { cls: 'month-row' });
        
        row.createEl('td', { text: monthName, cls: 'month-label' });

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const dayCells = [];

        const activeMultiDayEntries = [];
        
        multiDayEntries.forEach((entry) => {
            if (entry.month === month && entry.year === year) {
                activeMultiDayEntries.push(entry);
            }
        });

        const occupiedRows = [];
        const barPositions = new Map();
        
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
            
            // Check if daily note exists for hover preview
            const dailyNoteFilename = this.formatDateForDailyNote(date);
            const folderPath = this.getDailyNoteFolder();
            
            // Search for the daily note
            const dailyNoteFile = await this.findDailyNoteInFolder(`${dailyNoteFilename}.md`, folderPath);
            
            if (dailyNoteFile) {
                // Daily note exists - add internal-link class and hover preview
                dayNumber.addClass('internal-link');
                dayNumber.setAttr('data-href', dailyNoteFile.path);
                
                dayNumber.addEventListener('mouseover', (event) => {
                    this.app.workspace.trigger('hover-link', {
                        event,
                        source: VIEW_TYPE_CALENDAR,
                        hoverParent: this,
                        targetEl: dayNumber,
                        linktext: dailyNoteFile.path
                    });
                });
            }
            
            dayNumber.onclick = (e) => {
                e.preventDefault();
                this.openOrCreateDailyNote(date);
            };

            const notesForDay = notesMap.get(dateKey) || [];
            
            const singleDayNotes = notesForDay.filter(n => !n.isMultiDay);
            if (singleDayNotes.length > 0) {
                const notesContainer = dayCell.createEl('div', { cls: 'day-notes' });
                singleDayNotes.forEach(noteInfo => {
                    const noteLink = notesContainer.createEl('a', {
                        text: noteInfo.file.basename,
                        cls: 'note-link internal-link',
                        href: '#'
                    });
                    
                    noteLink.setAttr('data-href', noteInfo.file.path);
                    
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

        // Create multi-day bars (must happen after cells are added to DOM)
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
                    text: entry.file.basename,
                    cls: 'multi-day-link internal-link',
                    href: '#'
                });
                
                noteLink.setAttr('data-href', entry.file.path);
                
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
                            const lastCell = cells[startIndex + pos.span - 1];
                            
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

    async onClose() {
        // Cleanup
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }
}

class LinearCalendarPlugin extends obsidian.Plugin {
    async onload() {
        await this.loadSettings();

        this.registerView(
            VIEW_TYPE_CALENDAR,
            (leaf) => new LinearCalendarView(leaf, this)
        );

        this.addRibbonIcon('calendar', 'Open Linear Calendar', () => {
            this.activateView();
        });

        this.addCommand({
            id: 'open-linear-calendar',
            name: 'Open Linear Calendar',
            callback: () => {
                this.activateView();
            }
        });

        this.addSettingTab(new CalendarSettingTab(this.app, this));
    }

    async activateView() {
        const { workspace } = this.app;

        let leaf = null;
        const leaves = workspace.getLeavesOfType(VIEW_TYPE_CALENDAR);

        if (leaves.length > 0) {
            leaf = leaves[0];
        } else {
            leaf = workspace.getLeaf(false);
            await leaf.setViewState({ type: VIEW_TYPE_CALENDAR, active: true });
        }

        workspace.revealLeaf(leaf);
    }

    onunload() {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_CALENDAR);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class CalendarSettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Linear Calendar Settings' });

        new obsidian.Setting(containerEl)
            .setName('Date property')
            .setDesc('The frontmatter property for the date (YYYY-MM-DD format)')
            .addText(text => text
                .setPlaceholder('lincal_date')
                .setValue(this.plugin.settings.dateProperty)
                .onChange(async (value) => {
                    this.plugin.settings.dateProperty = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('End date property')
            .setDesc('The frontmatter property for multi-day entries (YYYY-MM-DD format)')
            .addText(text => text
                .setPlaceholder('lincal_date_end')
                .setValue(this.plugin.settings.endDateProperty)
                .onChange(async (value) => {
                    this.plugin.settings.endDateProperty = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Daily note format')
            .setDesc('Format for daily note filenames (use YYYY for year, MM for month, DD for day)')
            .addText(text => text
                .setPlaceholder('YYYY-MM-DD')
                .setValue(this.plugin.settings.dailyNoteFormat)
                .onChange(async (value) => {
                    this.plugin.settings.dailyNoteFormat = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Daily notes folder mode')
            .setDesc('Choose where to look for and create daily notes')
            .addDropdown(dropdown => dropdown
                .addOption('obsidian', 'Use native Daily Notes plugin\'s "New file location"')
                .addOption('custom', 'Use custom folder')
                .setValue(this.plugin.settings.dailyNoteFolderMode)
                .onChange(async (value) => {
                    this.plugin.settings.dailyNoteFolderMode = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show/hide custom folder setting
                }));

        if (this.plugin.settings.dailyNoteFolderMode === 'custom') {
            const setting = new obsidian.Setting(containerEl)
                .setName('Custom daily notes folder')
                .setDesc('Folder path for daily notes. Searches subfolders too.')
                .addText(text => {
                    text
                        .setPlaceholder('Daily Notes')
                        .setValue(this.plugin.settings.dailyNoteCustomFolder)
                        .onChange(async (value) => {
                            // Remove leading/trailing slashes
                            const cleaned = value.replace(/^\/+|\/+$/g, '');
                            this.plugin.settings.dailyNoteCustomFolder = cleaned;
                            await this.plugin.saveSettings();
                        });
                    
                    // Add folder suggestions
                    new FolderSuggest(this.app, text.inputEl);
                });
        }
    }
}

// Simple folder suggester
class FolderSuggest {
    constructor(app, inputEl) {
        this.app = app;
        this.inputEl = inputEl;
        this.suggestions = null;
        
        this.inputEl.addEventListener('input', () => this.updateSuggestions());
        this.inputEl.addEventListener('focus', () => this.updateSuggestions());
        this.inputEl.addEventListener('blur', () => {
            setTimeout(() => this.closeSuggestions(), 200);
        });
    }
    
    getAllFolders() {
        const folders = [];
        const recurse = (folder) => {
            if (folder.path) folders.push(folder.path);
            if (folder.children) {
                for (const child of folder.children) {
                    if (child instanceof obsidian.TFolder) {
                        recurse(child);
                    }
                }
            }
        };
        recurse(this.app.vault.getRoot());
        return folders;
    }
    
    updateSuggestions() {
        const query = this.inputEl.value.toLowerCase();
        const allFolders = this.getAllFolders();
        const matches = allFolders
            .filter(folder => folder.toLowerCase().includes(query))
            .slice(0, 10);
        
        this.showSuggestions(matches);
    }
    
    showSuggestions(folders) {
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
            this.suggestions.appendChild(item);
        });
        
        const rect = this.inputEl.getBoundingClientRect();
        this.suggestions.style.top = (rect.bottom + 2) + 'px';
        this.suggestions.style.left = rect.left + 'px';
        this.suggestions.style.width = rect.width + 'px';
        
        document.body.appendChild(this.suggestions);
    }
    
    closeSuggestions() {
        if (this.suggestions) {
            this.suggestions.remove();
            this.suggestions = null;
        }
    }
}

module.exports = LinearCalendarPlugin;