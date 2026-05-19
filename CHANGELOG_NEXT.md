# Changelog — Next Release Draft

Add entries here during development. When releasing, move contents into CHANGELOG.md under the new version heading and delete this file's content.

Formating: Options for headers are Added, Changed, Imprived, Fixed as H3 elements.
Points are bullet points starting usually with bold text containing the core information, additional plain text and optional indented bullet points.
Current CHANGELOG.md can serve as orientation.

---

### Added
- **Settings button in calendar header** — a gear icon button now appears to the right of the Add Note button. Clicking it opens the LinearCalendar settings tab directly. This improves navigation speed.
- **Category visibility (hide/show)** — each category chip in the calendar's index row now has an eye icon. Clicking it hides or shows all notes belonging to that category without touching the category definition. Hidden categories stay visible in the index row but appear dimmed. Notes disappear from the calendar entirely (including multi-day bars) when their category is hidden.
- **Confirmation dialogs for destructive category actions** — disabling or deleting a category now shows a confirmation prompt, preventing accidental changes.
- **Instant tooltips on category action buttons** — all icon buttons in the category settings list and edit modal show their label immediately on hover, with no browser delay, using a CSS-based tooltip.

### Improved
- **Category disable/enable UX** — the enabled checkbox in the category list and edit modal has been replaced with a dedicated ban-icon button. When a category is disabled, the ban icon turns red and the entire category row fades out, making its inactive state immediately visible. The button is consistently labelled "Disable" / "Enable" throughout settings and the modal.
- **Category edit modal footer** — the Delete and Disable buttons are now left-aligned, with Close on the right, making the layout clearer and reducing the chance of accidental deletion. All three buttons show instant tooltips consistent with the settings list.
- **Delete button in category settings list** — the × button has been replaced with a trash icon, matching the modal and making its purpose unambiguous.
- **"Your Categories" description** — the text above the categories list has been rewritten to clearly explain the first-match principle, the scope of matching, and the "what you see is what you get" behaviour.
- **Terminology unified** — "ignore / enable" wording consolidated to "disable / enable" across all UI text, tooltips, and code, matching the underlying `enabled` data field.
