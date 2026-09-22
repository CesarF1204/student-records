/* =========================================================================
   Export service — CSV generation, download and the export progress modal
   This module is loaded on demand (dynamic import) since exporting is an
   infrequently used, self-contained feature.
   ========================================================================= */
import { $ } from "../utils/dom.js";
import { EXPORT_DURATION_MS, EXPORT_FILENAME } from "../config/constants.js";
import { getExportModal, setExportCleanup } from "../components/modals.js";
import { showToast } from "../components/toast.js";
import { records } from "../store/studentStore.js";

/* ============================ CSV generation ========================== */
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

const downloadCsv = (csv) => {
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = EXPORT_FILENAME;
    a.click();
    URL.revokeObjectURL(url);
};

const exportCSV = () => {
    downloadCsv(toCsv(records));
    showToast("Export complete", `Student records exported as ${EXPORT_FILENAME}`, "success");
};

/* ----------------------- Export progress sequence ------------------------ */
let exportTimer = null;
let cleanupRegistered = false;

const setExportProgress = (percent) => {
    $("#exportProgressBar").style.width = `${percent}%`;
    $("#exportPercent").textContent = `${percent}%`;
    $("#exportModal").querySelector(".progress").setAttribute("aria-valuenow", String(percent));
};

const resetExportModal = () => {
    setExportProgress(1);
    $("#exportMessage").classList.remove("d-none");
    $("#exportComplete").classList.add("d-none");
    $("#exportError").classList.add("d-none");
    $("#exportErrorDetail").classList.add("d-none");
    $("#exportModalFooter").classList.add("d-none");
};

const clearExportTimer = () => {
    if (exportTimer) {
        clearInterval(exportTimer);
        exportTimer = null;
    }
};

const showExportComplete = () => {
    $("#exportMessage").classList.add("d-none");
    $("#exportComplete").classList.remove("d-none");
    $("#exportModalFooter").classList.remove("d-none");
};

const showExportError = () => {
    $("#exportMessage").classList.add("d-none");
    $("#exportError").classList.remove("d-none");
    $("#exportErrorDetail").classList.remove("d-none");
    $("#exportModalFooter").classList.remove("d-none");
};

// Always clean up the export timer if the modal is dismissed for any reason
const registerCleanup = () => {
    if (cleanupRegistered) return;
    cleanupRegistered = true;
    setExportCleanup(() => {
        clearExportTimer();
        $("#exportBtn").disabled = false;
    });
};

/** Start the simulated export: progress → generate CSV → download. */
export const startExport = () => {
    // Prevent duplicate exports / multiple timers while one is in progress
    if (exportTimer) return;

    registerCleanup();
    $("#exportBtn").disabled = true;
    resetExportModal();
    getExportModal().show();

    const tickMs = EXPORT_DURATION_MS / 100; // 1% per tick => exactly 100 steps
    let progress = 1;
    setExportProgress(progress);

    exportTimer = setInterval(() => {
        if (progress >= 100) {
            clearExportTimer();
            try {
                exportCSV();
                showExportComplete();
            } catch {
                showExportError();
            }
            $("#exportBtn").disabled = false;
            return;
        }
        progress += 1;
        setExportProgress(progress);
    }, tickMs);
};