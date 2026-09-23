import { THEME_STORAGE_KEY, THEME_ATTRIBUTE, THEME_TRANSITION_MS } from "../config/constants.js";

const LIGHT = "light";
const DARK = "dark";

/* Wash color used by the crossfade: the incoming mode's page background. */
const THEME_WASH = {
    [LIGHT]: "rgba(243, 245, 248, 0.55)",
    [DARK]: "rgba(11, 18, 32, 0.55)",
};

const themeRoot = document.documentElement;
let crossfadeTimer = null;

/**
 * DOCU: Tells whether the visitor asked the system to reduce motion.
 * Last Updated Date: September 23, 2026
 * @function prefersReducedMotion
 * @returns {boolean} True when reduced motion is requested
 * @author Cesar
 */
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * DOCU: Reads the theme currently applied to the document.
 * Last Updated Date: September 23, 2026
 * @function getActiveTheme
 * @returns {string} "light" or "dark"
 * @author Cesar
 */
export const getActiveTheme = () =>
    themeRoot.getAttribute(THEME_ATTRIBUTE) === DARK ? DARK : LIGHT;

/**
 * DOCU: Reads the operating system color-scheme preference, used on a first
 * visit before the visitor has chosen a theme.
 * Last Updated Date: September 23, 2026
 * @function getSystemTheme
 * @returns {string} "light" or "dark"
 * @author Cesar
 */
export const getSystemTheme = () =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? DARK : LIGHT;

/**
 * DOCU: Reads the theme the visitor picked earlier, if any.
 * Last Updated Date: September 23, 2026
 * @function getStoredTheme
 * @returns {string|null} "light" | "dark" | null when nothing is stored
 * @author Cesar
 */
export const getStoredTheme = () => {
    try {
        const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
        return stored === LIGHT || stored === DARK ? stored : null;
    } catch {
        /* Storage can be blocked (private mode / cookies disabled) — the app
           then simply follows the system preference for this visit. */
        return null;
    }
};

/**
 * DOCU: Saves the visitor's explicit theme choice.
 * Last Updated Date: September 23, 2026
 * @function persistTheme
 * @param {string} theme - "light" or "dark"
 * @returns {void}
 * @author Cesar
 */
const persistTheme = (theme) => {
    try {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
        /* Storage unavailable: the choice lasts for this page view only. */
    }
};

/**
 * DOCU: Keeps the navbar switch's exposed state in sync with the palette.
 * Last Updated Date: September 23, 2026
 * @function syncToggle
 * @param {string} theme - The theme that is now active
 * @returns {void}
 * @author Cesar
 */
const syncToggle = (theme) => {
    const isDark = theme === DARK;
    const label = isDark ? "Switch to light mode" : "Switch to dark mode";
    document.querySelectorAll(".sr-theme-toggle").forEach((button) => {
        button.setAttribute("aria-checked", String(isDark));
        button.setAttribute("aria-label", label);
    });
};

/**
 * DOCU: Fades a soft wash of the incoming theme across the viewport, inspired
 * by the reference portfolio's theme crossfade.
 * Last Updated Date: September 23, 2026
 * @function runThemeWash
 * @param {string} theme - The theme being applied
 * @returns {void}
 * @author Cesar
 */
const runThemeWash = (theme) => {
    const wash = document.createElement("div");
    wash.className = "sr-theme-fade";
    wash.setAttribute("aria-hidden", "true");
    wash.style.setProperty("--sr-theme-fade-color", THEME_WASH[theme] ?? THEME_WASH[LIGHT]);
    document.body.appendChild(wash);
    wash.addEventListener("animationend", () => wash.remove(), { once: true });
};

/**
 * DOCU: Crossfades the themed surfaces for the length of a single switch. The
 * helper class is removed again so ordinary hover/transition timings are never
 * altered, and nothing animates when reduced motion is requested.
 * Last Updated Date: September 23, 2026
 * @function runThemeCrossfade
 * @param {string} theme - The theme being applied
 * @returns {void}
 * @author Cesar
 */
const runThemeCrossfade = (theme) => {
    if (prefersReducedMotion()) return;

    themeRoot.classList.add("sr-theme-changing");
    window.clearTimeout(crossfadeTimer);
    crossfadeTimer = window.setTimeout(
        () => themeRoot.classList.remove("sr-theme-changing"),
        THEME_TRANSITION_MS
    );

    runThemeWash(theme);
};

/**
 * DOCU: Confirms the press with a short glow on the switch itself (Web
 * Animations API; skipped for reduced motion or when unsupported).
 * Last Updated Date: September 23, 2026
 * @function pulseToggle
 * @param {HTMLElement} button - The theme switch element
 * @returns {void}
 * @author Cesar
 */
const pulseToggle = (button) => {
    if (prefersReducedMotion() || typeof button.animate !== "function") return;
    button.animate(
        [
            { boxShadow: "0 0 0 0 rgba(124, 179, 234, 0.45)" },
            { boxShadow: "0 0 0 16px rgba(124, 179, 234, 0)" },
        ],
        { duration: 480, easing: "ease-out" }
    );
};

/**
 * DOCU: Applies a theme to the document, crossfades the change and syncs the
 * switch. The palette itself is a single attribute on <html> — every color in
 * the stylesheet resolves from it.
 * Last Updated Date: September 23, 2026
 * @function applyTheme
 * @param {string} theme - "light" or "dark"
 * @param {Object} [options] - Options
 * @param {boolean} [options.animate] - Allow the crossfade (default true)
 * @returns {string} The theme that is now active
 * @author Cesar
 */
export const applyTheme = (theme, { animate = true } = {}) => {
    const next = theme === DARK ? DARK : LIGHT;
    if (animate) runThemeCrossfade(next);

    themeRoot.setAttribute(THEME_ATTRIBUTE, next);
    /* Keep the browser-owned surfaces (scrollbars, native pickers) in step. */
    document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", next);
    syncToggle(next);

    return next;
};

/**
 * DOCU: Stores the visitor's explicit choice and applies it.
 * Last Updated Date: September 23, 2026
 * @function setTheme
 * @param {string} theme - "light" or "dark"
 * @returns {string} The theme that is now active
 * @author Cesar
 */
export const setTheme = (theme) => {
    const next = applyTheme(theme);
    persistTheme(next);
    return next;
};

/**
 * DOCU: Flips between light and dark mode.
 * Last Updated Date: September 23, 2026
 * @function toggleTheme
 * @returns {string} The theme that is now active
 * @author Cesar
 */
export const toggleTheme = () => setTheme(getActiveTheme() === DARK ? LIGHT : DARK);

/**
 * DOCU: Wires the navbar switch, follows the operating system while no explicit
 * choice is saved, and keeps every open tab of the app in sync. The palette was
 * already applied by the inline boot script in index.html, so the first paint is
 * never wrong-themed; this function only takes over from there.
 * Last Updated Date: September 23, 2026
 * @function initThemeToggle
 * @returns {void}
 * @author Cesar
 */
export const initThemeToggle = () => {
    /* Re-assert the boot theme so attribute, <meta> and switch all agree. */
    applyTheme(getActiveTheme(), { animate: false });

    document.querySelectorAll(".sr-theme-toggle").forEach((button) => {
        button.addEventListener("click", () => {
            toggleTheme();
            pulseToggle(button);
        });
    });

    /* No saved choice yet? Keep following the system if it changes mid-session. */
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
        if (!getStoredTheme()) applyTheme(event.matches ? DARK : LIGHT);
    });

    /* Another tab or window of the app changed the theme. */
    window.addEventListener("storage", (event) => {
        if (event.key !== THEME_STORAGE_KEY) return;
        applyTheme(event.newValue === DARK ? DARK : LIGHT, { animate: false });
    });
};
