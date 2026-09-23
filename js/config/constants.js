/** Average score required for a student to count as "Passed". */
export const PASS_THRESHOLD = 75;

/** Rows per page shown initially (select offers 5/10/25/50). */
export const DEFAULT_PAGE_SIZE = 5;

/** Duration of the simulated export progress (1% → 100%). */
export const EXPORT_DURATION_MS = 10000;

/** Delay before the export modal closes itself after the user cancels. */
export const EXPORT_CANCEL_CLOSE_DELAY_MS = 500;

/** Number of tone classes (avatar-tone-0 … avatar-tone-5) in style.css. */
export const AVATAR_TONES = 6;

/** Admin identity — same avatar system as every other user. */
export const ADMIN = {
    name: "Admin",
    email: "admin@school.edu",
    avatarUrl: "https://cdn-icons-png.flaticon.com/128/3135/3135715.png",
};

/** Name of the downloaded CSV file produced by the export feature. */
export const EXPORT_FILENAME = "student-records.csv";

/** Brief delay before a filter/reset change renders, so the loading animation is visible. */
export const FILTER_RENDER_DELAY_MS = 350;

/**
 * localStorage key holding the user's explicit theme choice ("light" | "dark").
 * Keep in sync with the inline theme boot script in index.html.
 */
export const THEME_STORAGE_KEY = "student-records-theme";

/** Root attribute Bootstrap 5.3 reads to switch color modes. */
export const THEME_ATTRIBUTE = "data-bs-theme";

/** Length of the light/dark crossfade — matches the CSS transition duration. */
export const THEME_TRANSITION_MS = 360;
