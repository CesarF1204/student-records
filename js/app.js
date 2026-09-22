/* =========================================================================
   Student Records Dashboard — application entry point
   App.js stays focused on composition + initialization:
   global providers (Bootstrap modals/toasts), page wiring and lazy loading
   of infrequently used features. All logic lives in dedicated modules.
   ========================================================================= */
import { $ } from "./utils/dom.js";
import { formatToday } from "./utils/format.js";
import { ADMIN } from "./config/constants.js";
import { paintAvatarEl } from "./components/avatar.js";
import { initModals, initTooltips, getExportModal } from "./components/modals.js";
import { initToast } from "./components/toast.js";
import { initStudentTable, renderAll, showTableLoading } from "./features/studentTable.js";
import { initFindStudent } from "./features/findStudent.js";
import { initStudentForm, openStudentModal } from "./features/studentForm.js";
import { initStudentModals, openDeleteModal, openViewModal } from "./features/studentModals.js";

/* ------------------------ Header identity + clock ------------------------ */
const renderHeader = () => {
    paintAvatarEl($("#adminAvatar"), ADMIN.name, ADMIN.avatarUrl);
    paintAvatarEl($("#adminAvatarMenu"), ADMIN.name, ADMIN.avatarUrl);
    $("#todayLabel").textContent = formatToday();

    const footerYear = $("#footerYear");
    if (footerYear) {
        footerYear.textContent = String(new Date().getFullYear());
    }
};

/* --------------------- Export (lazy / code splitting) ---------------------
   The export service (CSV generation + progress sequence) is only downloaded
   the first time the user actually exports. */
const wireExport = () => {
    $("#exportBtn").addEventListener("click", async () => {
        try {
            const { startExport } = await import("./services/exportService.js");
            startExport();
        } catch (err) {
            // Chunk failed to load (e.g. offline) — keep the button usable.
            console.error("Failed to load the export module:", err);
        }
    });
    $("#exportCloseBtn").addEventListener("click", () => getExportModal()?.hide());
};

/* ================================= Init ================================= */
const init = () => {
    initModals();
    initToast();
    initTooltips();

    renderHeader();
    wireExport();

    initStudentTable({
        onView: openViewModal,
        onEdit: openStudentModal,
        onDelete: openDeleteModal,
    });
    initFindStudent();
    initStudentForm();
    initStudentModals();

    showTableLoading();

    // Brief simulated load, then render.
    setTimeout(() => {
        renderAll();
    }, 450);
};

init();