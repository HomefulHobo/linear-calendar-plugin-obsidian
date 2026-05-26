# Changelog — Next Release Draft

Add entries here during development. When releasing, move contents into CHANGELOG.md under the new version heading and delete this file's content.

Formating: Options for headers are Added, Changed, Imprived, Fixed as H3 elements.
Points are bullet points starting usually with bold text containing the core information, additional plain text and optional indented bullet points.
Current CHANGELOG.md can serve as orientation.

---

### Added
- **Settings button in calendar header** — a gear icon button now appears to the right of the Add Note button. Clicking it opens the LinearCalendar settings tab directly. This improves navigation speed.
- **Category visibility toggle (hide/show)** — each category chip in the calendar's index row now has an eye icon. Clicking it hides or shows all notes belonging to that category. Hidden categories' chips appear dimmed.
- **Confirmation dialogs for destructive category actions** — disabling or deleting a category now shows a confirmation prompt, preventing accidental changes.
- **Instant tooltips on category action buttons** — all icon buttons in the category settings list and edit modal show their label immediately on hover, with no browser delay, using a CSS-based tooltip.

### Improved
- **Category disable/enable UX** — the enabled checkbox in the category list and edit modal has been replaced with a dedicated ban-icon button. When a category is disabled, the ban icon turns red and the entire category row fades out, making its inactive state immediately visible. The button is consistently labelled "Disable" / "Enable" throughout settings and the modal.
- **Category edit modal footer** — the Delete and Disable buttons are now left-aligned, with Close on the right, making the layout clearer and reducing the chance of accidental deletion.
- **Delete button in category settings list** — the × button has been replaced with a trash icon, matching the modal and making its purpose unambiguous.
- **"Your Categories" description** — the text above the categories list has been rewritten to clearly explain the first-match principle, the scope of matching, and the "what you see is what you get" behaviour.

---

## Recurring Events (in development — not yet in release)

### Added
- **Recurring Events** — notes can now appear on the calendar on a recurring schedule (yearly, monthly, or weekly) without creating extra files. Register a property name in the new **Recurring Events** settings tab, then add that property to any note with a date value.
- Two supported formats:
  - **Full ISO date** (`1980-03-14`) — recommended for birthdays and anniversaries; the plugin tracks the start year for age counting. Repeat rhythm (yearly / monthly / weekly) is set per rule
  - **RRULE pattern** — for complex schedules like "2nd Tuesday of every month" or "last Sunday". An optional start-date and/or end-date property can be set. _This format is what other calendar apps use._
- **Display Title** configurable per rule: `note title` only, `title + property name`, or `title + property name + years elapsed` (e.g. "Mom Smith – Birthday (46)")
- **Custom Separator** between title and property name can be set or left empty for none.
- **Hover tooltip** on recurring calendar entries shows the full formatted label, not the raw filename
- **RRULE builder modal** — a UI to generate RRULE strings (Yearly / Monthly / Nth weekday / last weekday / Weekly) with a live plain-language preview.
    - Accessible via the command palette ("Edit recurring rule for current note"), by right-clicking a recurring note in the calendar or by clicking the edit icon in a note's property.
- **Live preview property display** — RRULE properties in the note's Properties pane show their human-readable description (e.g. "Every year in March on the 14th") alongside an inline pencil icon that opens the RRULE builder. The raw RRULE string is only visible in source mode.
- **Inline editor widget** — a pencil icon appears next to registered RRULE properties in the note's source-mode editor, opening the RRULE builder directly
- **Date extraction hint** — the Basic Settings tab points to the Recurring Events tab for date extraction tied to recurring notes
- **Birthday rule pre-configured** — new users see a ready-to-use "birthday" rule (full ISO date, yearly, title + years elapsed) so the feature is immediately understandable
