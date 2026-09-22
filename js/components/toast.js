import { $ } from "../utils/dom.js";

const TOAST_ICONS = {
    success: "bi-check-circle-fill text-success",
    danger: "bi-x-circle-fill text-danger",
    info: "bi-info-circle-fill text-primary",
};

let toastEl;

/**
 * DOCU: Creates the shared toast instance.
 * Last Updated Date: September 22, 2026
 * @function initToast
 * @returns {void}
 * @author Cesar
 */
export const initToast = () => {
    if (!window.bootstrap) return;
    toastEl = new bootstrap.Toast($("#liveToast"));
};

/**
 * DOCU: Shows a toast notification.
 * Last Updated Date: September 22, 2026
 * @function showToast
 * @param {string} title - Toast title
 * @param {string} message - Toast message body
 * @param {string} type - Severity type (success/danger/info)
 * @returns {void}
 * @author Cesar
 */
export const showToast = (title, message, type = "info") => {
    if (!toastEl) return;
    $("#toastIcon").className = `bi ${TOAST_ICONS[type] || TOAST_ICONS.info} me-2`;
    $("#toastTitle").textContent = title;
    $("#toastBody").textContent = message;
    toastEl.show();
};