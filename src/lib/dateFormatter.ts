/**
 * Utility helper functions for Thai date and time formatting across DSD Yala Queue System
 */

export function formatThaiDate(dateStr?: string | Date | null): string {
    if (!dateStr) return "—";
    try {
        const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
        if (isNaN(d.getTime())) return String(dateStr);

        return d.toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    } catch {
        return String(dateStr);
    }
}

export function formatThaiDateTime(dateStr?: string | Date | null): string {
    if (!dateStr) return "—";
    try {
        const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
        if (isNaN(d.getTime())) return String(dateStr);

        const datePart = d.toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
        const timePart = d.toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
        });

        return `${datePart} ${timePart} น.`;
    } catch {
        return String(dateStr);
    }
}

export function formatDateRangeTh(startDateStr?: string, endDateStr?: string): string {
    if (!startDateStr && !endDateStr) return "—";
    if (startDateStr && endDateStr) {
        const start = formatThaiDate(startDateStr);
        const end = formatThaiDate(endDateStr);
        return `${start} - ${end}`;
    }
    return formatThaiDate(startDateStr || endDateStr);
}
