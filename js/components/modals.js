/* =========================================================================
   Bootstrap modal instances (single shared set)
   ========================================================================= */
import { $ } from "../utils/dom.js";

let studentModal, viewModal, deleteModal, exportModal;

/** Create all modal instances + one-off global listeners; call at init. */
export const initModals = () => {
    if (!window.bootstrap) return;
    studentModal = new bootstrap.Modal($("#studentModal"));
    viewModal = new bootstrap.Modal($("#viewStudentModal"));
    deleteModal = new bootstrap.Modal($("#deleteStudentModal"));
    exportModal = new bootstrap.Modal($("#exportModal"));

    // Always clean up the export timer if the modal is dismissed for any reason
    $("#exportModal").addEventListener("hidden.bs.modal", () => {
        resetExportState();
    });
};

/** Tooltips are not auto-initialized in Bootstrap 5. */
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

/**
 * Cleanup executed whenever the export modal is dismissed for any reason.
 * The export feature registers this callback so its timer can be cleared.
 */
let exportCleanup = () => {};
export const setExportCleanup = (fn) => {
    exportCleanup = typeof fn === "function" ? fn : () => {};
};
const resetExportState = () => exportCleanup();