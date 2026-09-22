import { $ } from "../utils/dom.js";
import { EXPORT_DURATION_MS, EXPORT_CANCEL_CLOSE_DELAY_MS, EXPORT_FILENAME } from "../config/constants.js";
import { getExportModal, setExportCleanup } from "../components/modals.js";
import { showToast } from "../components/toast.js";
import { records } from "../store/studentStore.js";

/**
 * DOCU: Converts student records into CSV text.
 * Last Updated Date: September 22, 2026
 * @function toCsv
 * @param {Array} list - Student records to export
 * @returns {string} CSV content
 * @author Cesar
 */
const toCsv = (list) => {
    const header = ["ID", "Name", "Email", "Section", "Status", "Enrolled", "Exam1", "Exam2", "Exam3", "Average", "Result"];
    const rows = list.map((r) =>
        [r.id, r.name, r.email, r.section, r.active ? "Active" : "Inactive", r.enrolled, ...r.scores, r.average, r.isPassed ? "Passed" : "Needs improvement"]
    );
    return [header, ...rows]
        .map((row) =>
            row.map((cell) => {
                const s = String(cell);
                return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
            }).join(",")
        )
        .join("\n");
};

/**
 * DOCU: Downloads the CSV file to the user's device.
 * Last Updated Date: September 22, 2026
 * @function downloadCsv
 * @param {string} csv - CSV content to download
 * @returns {void}
 * @author Cesar
 */
const downloadCsv = (csv) => {
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = EXPORT_FILENAME;
    a.click();
    URL.revokeObjectURL(url);
};

/**
 * DOCU: Generates the CSV, downloads it and shows a success toast.
 * Last Updated Date: September 22, 2026
 * @function exportCSV
 * @returns {void}
 * @author Cesar
 */
const exportCSV = () => {
    downloadCsv(toCsv(records));
    showToast("Export complete", `Student records exported as ${EXPORT_FILENAME}`, "success");
};

let exportTimer = null;
let safetyTimer = null;
let cleanupRegistered = false;
let closeDelayTimer = null;
let cancelled = false;

/**
 * DOCU: Updates the progress bar, percent label and aria state.
 * Last Updated Date: September 22, 2026
 * @function setExportProgress
 * @param {number} percent - Progress percentage (1-100)
 * @returns {void}
 * @author Cesar
 */
const setExportProgress = (percent) => {
    $("#exportProgressBar").style.width = `${percent}%`;
    $("#exportPercent").textContent = `${percent}%`;
    $("#exportModal").querySelector(".progress").setAttribute("aria-valuenow", String(percent));
};

/**
 * DOCU: Resets the export modal to its initial progress state.
 * Last Updated Date: September 22, 2026
 * @function resetExportModal
 * @returns {void}
 * @author Cesar
 */
const resetExportModal = () => {
    const bar = $("#exportProgressBar");
    bar.classList.add("progress-bar-striped", "progress-bar-animated");
    setExportProgress(1);
    $("#exportMessage").classList.remove("d-none");
    $("#exportComplete").classList.add("d-none");
    $("#exportError").classList.add("d-none");
    $("#exportErrorDetail").classList.add("d-none");
    $("#exportModalFooter").classList.remove("d-none");
    $("#exportCancelBtn").classList.remove("d-none");
    $("#exportCloseBtn").classList.add("d-none");
};

/**
 * DOCU: Stops the export timer and safety timeout.
 * Last Updated Date: September 22, 2026
 * @function clearExportTimer
 * @returns {void}
 * @author Cesar
 */
const clearExportTimer = () => {
    if (exportTimer) {
        exportTimer.terminate();
        exportTimer = null;
    }
    if (safetyTimer) {
        clearTimeout(safetyTimer);
        safetyTimer = null;
    }
};

/**
 * DOCU: Stops the pending cancel-close timeout so it does not fire after the
 * modal has already been (or is being) dismissed by another path.
 * Last Updated Date: September 22, 2026
 * @function clearCloseDelayTimer
 * @returns {void}
 * @author Cesar
 */
const clearCloseDelayTimer = () => {
    if (closeDelayTimer) {
        clearTimeout(closeDelayTimer);
        closeDelayTimer = null;
    }
};

/**
 * DOCU: Shows the export-complete state in the modal.
 * Last Updated Date: September 22, 2026
 * @function showExportComplete
 * @returns {void}
 * @author Cesar
 */
const showExportComplete = () => {
    $("#exportMessage").classList.add("d-none");
    $("#exportComplete").classList.remove("d-none");
    $("#exportModalFooter").classList.remove("d-none");
    $("#exportCancelBtn").classList.add("d-none");
    $("#exportCloseBtn").classList.remove("d-none");
};

/**
 * DOCU: Shows the export-error state in the modal.
 * Last Updated Date: September 22, 2026
 * @function showExportError
 * @returns {void}
 * @author Cesar
 */
const showExportError = () => {
    $("#exportMessage").classList.add("d-none");
    $("#exportError").classList.remove("d-none");
    $("#exportErrorDetail").classList.remove("d-none");
    $("#exportModalFooter").classList.remove("d-none");
    $("#exportCancelBtn").classList.add("d-none");
    $("#exportCloseBtn").classList.remove("d-none");
};

/**
 * DOCU: Registers the one-time cleanup for an unexpected modal dismiss.
 * Last Updated Date: September 22, 2026
 * @function registerCleanup
 * @returns {void}
 * @author Cesar
 */
const registerCleanup = () => {
    if (cleanupRegistered) return;
    cleanupRegistered = true;
    $("#exportCancelBtn").addEventListener("click", cancelExport);
    setExportCleanup(() => {
        clearExportTimer();
        clearCloseDelayTimer();
        $("#exportBtn").disabled = false;
    });
};

/**
 * DOCU: Cancels the running export, stops progress, blocks the download,
 * closes the modal after exactly 0.5 s, and shows a cancellation toast.
 * Last Updated Date: September 22, 2026
 * @function cancelExport
 * @returns {void}
 * @author Cesar
 */
const cancelExport = () => {
    if (cancelled || !exportTimer) return;
    cancelled = true;

    clearExportTimer();

    const bar = $("#exportProgressBar");
    bar.classList.remove("progress-bar-striped", "progress-bar-animated");

    /* Remove the cancel action immediately so it cannot be triggered twice
       while the modal closes itself 0.5 s later. */
    $("#exportCancelBtn").classList.add("d-none");

    clearCloseDelayTimer();
    closeDelayTimer = setTimeout(() => {
        closeDelayTimer = null;
        getExportModal()?.hide();
        showToast("Export cancelled", "The export was cancelled.", "info");
    }, EXPORT_CANCEL_CLOSE_DELAY_MS);
};

/**
 * DOCU: Starts the simulated export: progress, CSV generation, download.
 * Last Updated Date: September 22, 2026
 * @function startExport
 * @returns {void}
 * @author Cesar
 */
export const startExport = () => {
    if (exportTimer || closeDelayTimer) return;

    registerCleanup();
    cancelled = false;
    $("#exportBtn").disabled = true;
    resetExportModal();
    getExportModal().show();

    const tickMs = EXPORT_DURATION_MS / 100;
    const startedAt = Date.now();
    setExportProgress(1);

    /** Browsers throttle timers in background tabs, so a Web Worker drives
    the ticks. Progress derives from elapsed time to stay accurate. */
    let worker = null;
    let finished = false;
    const finish = () => {
        if (finished || cancelled) return;
        finished = true;
        clearExportTimer();
        try {
            exportCSV();
            showExportComplete();
        } catch {
            showExportError();
        }
        $("#exportBtn").disabled = false;
    };

    const workerCode = `setInterval(() => postMessage(0), ${Math.round(tickMs)});`;
    try {
        worker = new Worker(URL.createObjectURL(new Blob([workerCode], { type: "application/javascript" })));
        exportTimer = worker;

        worker.onmessage = () => {
            if (cancelled || finished) return;
            const percent = Math.min(100, 1 + Math.floor((Date.now() - startedAt) / tickMs));
            setExportProgress(percent);
            if (percent >= 100) finish();
        };
    } catch {
        /* Fallback interval, still time-based for throttled background tabs. */
        exportTimer = setInterval(() => {
            if (cancelled || finished) return;
            const percent = Math.min(100, 1 + Math.floor((Date.now() - startedAt) / tickMs));
            setExportProgress(percent);
            if (percent >= 100) finish();
        }, Math.round(tickMs));
        exportTimer.terminate = () => clearInterval(exportTimer);
    }
    safetyTimer = setTimeout(finish, EXPORT_DURATION_MS + tickMs);
};