import { RRule } from 'rrule';

/**
 * Converts an RRULE string to a human-readable description.
 * Returns null for iso_date values (Obsidian renders them as date pickers)
 * or when the value cannot be parsed.
 */
export function rruleValueToReadable(
    value: string,
    dateFormat: 'iso_date' | 'rrule' | undefined
): string | null {
    if (!value) return null;

    const fmt = dateFormat ?? (value.startsWith('FREQ=') ? 'rrule' : 'iso_date');

    if (fmt !== 'rrule') return null;
    if (!value.startsWith('FREQ=')) return null;

    try {
        const rule = RRule.fromString(value);
        const text = rule.toText();
        return text.charAt(0).toUpperCase() + text.slice(1);
    } catch {
        return null;
    }
}
