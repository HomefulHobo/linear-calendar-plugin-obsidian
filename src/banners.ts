import { LinearCalendarSettings } from './types';

export interface BannerContext {
    isBratUser: boolean;
}

export interface BannerDef {
    id: string;
    cssClass: string;
    borderColor: string;
    title: string;
    contentHtml: string;
    settingsName: string;
    settingsDesc: string;
    shouldShow: (settings: LinearCalendarSettings, ctx: BannerContext) => boolean;
    dismiss: (settings: LinearCalendarSettings) => void;
    reset: (settings: LinearCalendarSettings) => void;
    settingsVisible?: (ctx: BannerContext) => boolean;
}

export const BANNERS: BannerDef[] = [
    {
        id: 'quick-notes',
        cssClass: 'quick-note-welcome-banner',
        borderColor: 'var(--interactive-accent)',
        title: '🦈✨ Get Faster',
        contentHtml: `
            <strong>Click "Add Note"</strong> above to create a new note, or<br>
            <strong>Cmd/Ctrl+Click on any day</strong> number to create a dated note instantly<br>
            <strong>Cmd/Ctrl+Click and drag</strong> across days to create a multi-day note<br>
            ⚙️ <strong>Configure</strong> your preferred default behavior in this plugin's settings
        `,
        settingsName: 'Show Quick Notes banner',
        settingsDesc: 'Display the Quick Notes welcome banner with tips about creating notes quickly',
        shouldShow: (s) => s.quickNoteCreation.enabled && !s.banners.quickNotes,
        dismiss: (s) => { s.banners.quickNotes = true; },
        reset: (s) => { s.banners.quickNotes = false; },
    },
    {
        id: 'periodic-notes',
        cssClass: 'periodic-notes-welcome-banner',
        borderColor: 'var(--text-accent)',
        title: '📅 Periodic Notes',
        contentHtml: `
            <strong>Show periodic notes</strong> in the calendar<br>
            <strong>Click on periodic notes</strong> to create or open them<br>
            <strong>Compatible with the Periodic Notes Plugin</strong> so you don't have to transfer anything<br>
            <strong>Show various periods:</strong> Weekly, Monthly, Quarterly, Yearly, Custom Period<br>
            ⚙️ <strong>Configure</strong> periodic notes in this plugin's settings under "Periodic Notes"
        `,
        settingsName: 'Show Periodic Notes banner',
        settingsDesc: 'Display the Periodic Notes welcome banner with tips about weekly, monthly, and quarterly notes',
        shouldShow: (s) => !s.banners.periodicNotes,
        dismiss: (s) => { s.banners.periodicNotes = true; },
        reset: (s) => { s.banners.periodicNotes = false; },
    },
    {
        id: 'recurring-events',
        cssClass: 'recurring-events-welcome-banner',
        borderColor: 'var(--interactive-accent)',
        title: '🔁 Recurring Events',
        contentHtml: `
            🎉 <strong>Birthdays & Anniversaries!</strong><br>
            <strong>Show recurring events</strong>: make the same note appear regularly in your calendar<br>
            <strong>Supports two date formats</strong> standard Obsidian date (YYYY-MM-DD) and complex schedules via <strong>RRULE</strong><br>
            <strong>Show years elapsed</strong> — optionally display years passed since start-date<br>
            <strong>Use the simple RRULE builder</strong> based on natural language<br>
            ⚙️ <strong>Configure</strong> your recurring event rules in this plugin's settings under "Recurring Events"
        `,
        settingsName: 'Show Recurring Events banner',
        settingsDesc: 'Display the Recurring Events welcome banner with tips about birthdays, anniversaries, and recurring schedules',
        shouldShow: (s) => !s.banners.recurringEvents,
        dismiss: (s) => { s.banners.recurringEvents = true; },
        reset: (s) => { s.banners.recurringEvents = false; },
    },
    {
        id: 'community-plugin',
        cssClass: 'community-plugin-banner',
        borderColor: 'var(--text-accent)',
        title: '🎉 Now on Community Plugins',
        contentHtml: `
            <strong>Linear Calendar is now available in Obsidian's Community Plugins</strong> — for more transparency and ease of use!<br><br>
            <strong>Migration is seamless</strong> — your plugin folder and settings stay exactly the same, only the update method changes.<br>
            Your settings are stored in your vault at <code>.obsidian/plugins/linear-calendar/data.json</code> and are not affected.<br><br>
            <strong>How to migrate:</strong><br>
            1. Remove this plugin in BRAT settings (this will <em>not</em> uninstall the plugin)<br>
            2. Go to <strong>Linear Calendar</strong> through Settings → Community Plugins – it should already be installed<br>
            ⚠️ Always back up your vault before migrating, just to be safe.
        `,
        settingsName: 'Show Community Plugin banner',
        settingsDesc: 'Display the migration banner for users who installed via BRAT',
        shouldShow: (s, ctx) => ctx.isBratUser && !s.banners.communityPlugin,
        dismiss: (s) => { s.banners.communityPlugin = true; },
        reset: (s) => { s.banners.communityPlugin = false; },
        settingsVisible: (ctx) => ctx.isBratUser,
    },
];
