/* =========================================================================
   Student Records — shared constants
   ========================================================================= */

/** Average score required for a student to count as "Passed". */
export const PASS_THRESHOLD = 75;

/** Rows per page shown initially (select offers 5/10/25/50). */
export const DEFAULT_PAGE_SIZE = 5;

/** Duration of the simulated export progress (1% → 100%). */
export const EXPORT_DURATION_MS = 10000; // ~10 seconds

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