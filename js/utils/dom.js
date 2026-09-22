/**
 * DOCU: Shorthand for document.querySelector.
 * Last Updated Date: September 22, 2026
 * @function $
 * @param {string} sel - CSS selector to query
 * @returns {Element|null} The matching element, if any
 * @author Cesar
 */
export const $ = (sel) => document.querySelector(sel);

/**
 * DOCU: Runs the callback once input settles for the delay period.
 * Last Updated Date: September 22, 2026
 * @function debounce
 * @param {Function} callback - Function to run after the delay
 * @param {number} delay - Settle time in milliseconds
 * @returns {Function} Debounced function
 * @author Cesar
 */
export const debounce = (callback, delay = 1500) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => callback(...args), delay);
    };
};

/**
 * DOCU: Prevents leading whitespace from being typed or pasted.
 * Last Updated Date: September 22, 2026
 * @function preventLeadingSpace
 * @param {HTMLElement} input - The input field to guard
 * @returns {void}
 * @author Cesar
 */
export const preventLeadingSpace = (input) => {
    input.addEventListener("keydown", (e) => {
        if (e.key === " " && input.selectionStart === 0) {
            e.preventDefault();
        }
    });
    input.addEventListener("input", () => {
        if (/^\s/.test(input.value)) {
            input.value = input.value.replace(/^\s+/, "");
        }
    });
};

/**
 * DOCU: Blocks every space and cleans up pasted whitespace.
 * Last Updated Date: September 22, 2026
 * @function preventAnySpace
 * @param {HTMLElement} input - The input field to guard
 * @returns {void}
 * @author Cesar
 */
export const preventAnySpace = (input) => {
    input.addEventListener("keydown", (e) => {
        if (e.key === " ") {
            e.preventDefault();
        }
    });
    input.addEventListener("input", () => {
        if (/\s/.test(input.value)) {
            const pos = input.selectionStart ?? input.value.length;
            const removedBefore = (input.value.slice(0, pos).match(/\s/g) || []).length;
            input.value = input.value.replace(/\s+/g, "");
            const nextPos = Math.max(0, pos - removedBefore);
            try {
                input.setSelectionRange(nextPos, nextPos);
            } catch {
                /* input type may not support caret — ignore */
            }
        }
    });
    // Pasted spaces are stripped instantly.
    input.addEventListener("paste", (e) => {
        e.preventDefault();
        const text = (e.clipboardData?.getData("text") ?? "").replace(/\s+/g, "");
        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? input.value.length;
        input.value = input.value.slice(0, start) + text + input.value.slice(end);
        const nextPos = start + text.length;
        try {
            input.setSelectionRange(nextPos, nextPos);
        } catch {
            /* ignore */
        }
    });
};

/**
 * DOCU: Trims outer whitespace when the field loses focus.
 * Last Updated Date: September 22, 2026
 * @function trimOnBlur
 * @param {HTMLElement} input - The input field to trim
 * @returns {void}
 * @author Cesar
 */
export const trimOnBlur = (input) => {
    input.addEventListener("blur", () => {
        const trimmed = input.value.trim();
        if (input.value !== trimmed) input.value = trimmed;
    });
};