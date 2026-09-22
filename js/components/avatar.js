import { AVATAR_TONES } from "../config/constants.js";
import { escapeHtml, initials } from "../utils/format.js";

const AVATAR_TONE_CLASSES = Array.from({ length: AVATAR_TONES }, (_, i) => `avatar-tone-${i}`);

/**
 * DOCU: Picks a deterministic avatar tone class from the name.
 * Last Updated Date: September 22, 2026
 * @function avatarTone
 * @param {string} name - The name to derive the tone from
 * @returns {number} Tone index between 0 and AVATAR_TONES - 1
 * @author Cesar
 */
export const avatarTone = (name) => {
    const text = String(name ?? "");
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
        hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    }
    return hash % AVATAR_TONES;
};

/**
 * DOCU: Allows only http(s) URLs and relative paths for avatars.
 * Last Updated Date: September 22, 2026
 * @function sanitizeAvatarUrl
 * @param {string} url - The avatar URL to validate
 * @returns {string} The cleaned URL, or an empty string if not allowed
 * @author Cesar
 */
export const sanitizeAvatarUrl = (url) => {
    const clean = String(url ?? "").trim();
    if (!clean) return "";
    if (/^(https?:\/\/|\.\.?\/|\/)/i.test(clean)) return clean;
    return "";
};

/**
 * DOCU: Builds the avatar markup for template strings.
 * Last Updated Date: September 22, 2026
 * @function avatarHtml
 * @param {string} name - Student name shown as fallback initials
 * @param {string} avatarUrl - Optional avatar image URL
 * @param {string} size - Avatar size (xs/sm/md/lg)
 * @param {string} extraClass - Optional extra CSS classes
 * @returns {string} Avatar HTML markup
 * @author Cesar
 */
export const avatarHtml = (name, avatarUrl, size = "md", extraClass = "") => {
    const safeName = escapeHtml(String(name ?? "User"));
    const tone = avatarTone(name);
    const src = sanitizeAvatarUrl(avatarUrl);
    const cls = `avatar avatar-${size} avatar-tone-${tone}${extraClass ? ` ${extraClass}` : ""}`;
    const img = src
        ? `<img src="${escapeHtml(src)}" alt="" loading="lazy" onerror="this.remove()" />`
        : "";
    return `<span class="${cls}" role="img" aria-label="${safeName} avatar">${img}${escapeHtml(initials(name))}</span>`;
};

/**
 * DOCU: Updates an existing avatar element in place.
 * Last Updated Date: September 22, 2026
 * @function paintAvatarEl
 * @param {HTMLElement} el - The avatar element to update
 * @param {string} name - Student name for the initials fallback
 * @param {string} avatarUrl - Optional avatar image URL
 * @returns {void}
 * @author Cesar
 */
export const paintAvatarEl = (el, name, avatarUrl) => {
    if (!el) return;
    const src = sanitizeAvatarUrl(avatarUrl);
    el.classList.remove(...AVATAR_TONE_CLASSES);
    el.classList.add(`avatar-tone-${avatarTone(name)}`);
    el.querySelector("img")?.remove();
    if (src) {
        const img = document.createElement("img");
        img.src = src;
        img.alt = "";
        img.loading = "lazy";
        img.addEventListener("error", () => img.remove());
        el.prepend(img);
    }
    Array.from(el.childNodes).forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) node.remove();
    });
    el.append(document.createTextNode(initials(name)));
    el.setAttribute("aria-label", `${String(name ?? "User")} avatar`);
};