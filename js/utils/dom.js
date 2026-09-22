/* =========================================================================
   DOM helpers
   ========================================================================= */

/** Shorthand `document.querySelector`. */
export const $ = (sel) => document.querySelector(sel);

/** Debounce: run `callback` once input settles for `delay` ms. */
export const debounce = (callback, delay = 1500) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => callback(...args), delay);
    };
};

// Never allow leading whitespace to be typed/pasted into a field
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

// Block EVERY space inside emails (valid emails never contain spaces)
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
    // Pasted "  name@school.edu  " -> "name@school.edu" instantly
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

// Trim outer whitespace when leaving the field so the saved value is clean
export const trimOnBlur = (input) => {
    input.addEventListener("blur", () => {
        const trimmed = input.value.trim();
        if (input.value !== trimmed) input.value = trimmed;
    });
};