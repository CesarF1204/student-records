/* =========================================================================
   Avatar — one reusable avatar system
   Optional image URL if available, otherwise a polished deterministic
   initials fallback (no random photos, so no false identity).
   `size` maps to .avatar-xs/sm/md/lg.
   ========================================================================= */
import { AVATAR_TONES } from "../config/constants.js";
import { escapeHtml, initials } from "../utils/format.js";

const AVATAR_TONE_CLASSES = Array.from({ length: AVATAR_TONES }, (_, i) => `avatar-tone-${i}`);

export const avatarTone = (name) => {
    const text = String(name ?? "");
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
        hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    }
    return hash % AVATAR_TONES;
};

export const sanitizeAvatarUrl = (url) => {
    const clean = String(url ?? "").trim();
    if (!clean) return "";
    // Only allow http(s) URLs (and relative paths) so no javascript:/data: URIs.
    if (/^(https?:\/\/|\.\.?\/|\/)/i.test(clean)) return clean;
    return "";
};

/** Full <span class="avatar …"> markup for template strings. */
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

/** Paint an existing avatar element in place (keeps DOM node identity). */
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
    // Keep the initials text node in sync.
    Array.from(el.childNodes).forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) node.remove();
    });
    el.append(document.createTextNode(initials(name)));
    el.setAttribute("aria-label", `${String(name ?? "User")} avatar`);
};