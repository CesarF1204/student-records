
/**
 * DOCU: Escapes HTML special characters in a value.
 * Last Updated Date: September 22, 2026
 * @function escapeHtml
 * @param {*} value - Value to escape
 * @returns {string} Escaped string safe for HTML output
 * @author Cesar
 */
export const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (ch) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    })[ch]);

/**
 * DOCU: Formats an ISO date string for display.
 * Last Updated Date: September 22, 2026
 * @function formatDate
 * @param {string} iso - ISO date string (YYYY-MM-DD)
 * @returns {string} Formatted date, or the original value if invalid
 * @author Cesar
 */
export const formatDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso + "T00:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

/**
 * DOCU: Builds up-to-two-letter initials from a name.
 * Last Updated Date: September 22, 2026
 * @function initials
 * @param {string} name - The name to derive initials from
 * @returns {string} Initials, or "?" when the name is empty
 * @author Cesar
 */
export const initials = (name) =>
    String(name ?? "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join("") || "?";

/**
 * DOCU: Returns today's long date label for the header.
 * Last Updated Date: September 22, 2026
 * @function formatToday
 * @returns {string} Today's date, e.g. "Mon, Sep 22, 2026"
 * @author Cesar
 */
export const formatToday = () =>
    new Date().toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });