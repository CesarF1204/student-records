import { $ } from "../utils/dom.js";
import { EXPORT_DURATION_MS, EXPORT_FILENAME } from "../config/constants.js";
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
    setExportProgress(1);
    $("#exportMessage").classList.remove("d-none");
    $("#exportComplete").classList.add("d-none");
    $("#exportError").classList.add("d-none");
    $("#exportErrorDetail").classList.add("d-none");
    $("#exportModalFooter").classList.add("d-none");
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
    setExportCleanup(() => {
        clearExportTimer();
        $("#exportBtn").disabled = false;
    });
};

/**
 * DOCU: Starts the simulated export: progress, CSV generation, download.
 * Last Updated Date: September 22, 2026
 * @function startExport
 * @returns {void}
 * @author Cesar
 */
export const startExport = () => {
    if (exportTimer) return;

    registerCleanup();
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
        if (finished) return;
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
            const percent = Math.min(100, 1 + Math.floor((Date.now() - startedAt) / tickMs));
            setExportProgress(percent);
            if (percent >= 100) finish();
        };
    } catch {
        /* Fallback interval, still time-based for throttled background tabs. */
        exportTimer = setInterval(() => {
            const percent = Math.min(100, 1 + Math.floor((Date.now() - startedAt) / tickMs));
            setExportProgress(percent);
            if (percent >= 100) finish();
        }, Math.round(tickMs));
        exportTimer.terminate = () => clearInterval(exportTimer);
    }
    safetyTimer = setTimeout(finish, EXPORT_DURATION_MS + tickMs);
};