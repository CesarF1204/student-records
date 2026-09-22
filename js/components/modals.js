import { $ } from "../utils/dom.js";

let studentModal, viewModal, deleteModal, exportModal;

/**
 * DOCU: Creates the shared modal instances and cleanup listener.
 * Last Updated Date: September 22, 2026
 * @function initModals
 * @returns {void}
 * @author Cesar
 */
export const initModals = () => {
    if (!window.bootstrap) return;
    studentModal = new bootstrap.Modal($("#studentModal"));
    viewModal = new bootstrap.Modal($("#viewStudentModal"));
    deleteModal = new bootstrap.Modal($("#deleteStudentModal"));
    exportModal = new bootstrap.Modal($("#exportModal"));

    $("#exportModal").addEventListener("hidden.bs.modal", () => {
        resetExportState();
    });
};

/**
 * DOCU: Initializes all Bootstrap tooltips.
 * Last Updated Date: September 22, 2026
 * @function initTooltips
 * @returns {void}
 * @author Cesar
 */
export const initTooltips = () => {
    if (!window.bootstrap) return;
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
        new bootstrap.Tooltip(el);
    });
};

export const getStudentModal = () => studentModal;
export const getViewModal = () => viewModal;
export const getDeleteModal = () => deleteModal;
export const getExportModal = () => exportModal;

/* Callback the export feature registers to clean up its timer on dismiss. */
let exportCleanup = () => {};

/**
 * DOCU: Registers the callback run when the export modal is dismissed.
 * Last Updated Date: September 22, 2026
 * @function setExportCleanup
 * @param {Function} fn - Cleanup callback to run on dismiss
 * @returns {void}
 * @author Cesar
 */
export const setExportCleanup = (fn) => {
    exportCleanup = typeof fn === "function" ? fn : () => {};
};

/**
 * DOCU: Runs the registered export cleanup callback.
 * Last Updated Date: September 22, 2026
 * @function resetExportState
 * @returns {void}
 * @author Cesar
 */
const resetExportState = () => exportCleanup();