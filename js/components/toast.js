/* =========================================================================
   Toast notifications (Bootstrap)
   ========================================================================= */
import { $ } from "../utils/dom.js";

const TOAST_ICONS = {
    success: "bi-check-circle-fill text-success",
    danger: "bi-x-circle-fill text-danger",
    info: "bi-info-circle-fill text-primary",
};

let toastEl;

/** Create the toast instance; call once during app init. */
export const initToast = () => {
    if (!window.bootstrap) return;
    toastEl = new bootstrap.Toast($("#liveToast"));
};

/** Show a toast with the given title/message/severity. */
export const showToast = (title, message, type = "info") => {
    if (!toastEl) return;
    $("#toastIcon").className = `bi ${TOAST_ICONS[type] || TOAST_ICONS.info} me-2`;
    $("#toastTitle").textContent = title;
    $("#toastBody").textContent = message;
    toastEl.show();
};