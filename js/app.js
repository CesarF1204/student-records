import { $ } from "./utils/dom.js";
import { formatToday } from "./utils/format.js";
import { ADMIN } from "./config/constants.js";
import { paintAvatarEl } from "./components/avatar.js";
import { initModals, initTooltips, getExportModal } from "./components/modals.js";
import { initToast } from "./components/toast.js";
import { initThemeToggle } from "./components/theme.js";
import { initStudentTable, renderAll, showTableLoading } from "./features/studentTable.js";
import { initFindStudent } from "./features/findStudent.js";
import { initStudentForm, openStudentModal } from "./features/studentForm.js";
import { initStudentModals, openDeleteModal, openViewModal } from "./features/studentModals.js";

/**
 * DOCU: Renders the admin avatar and today's date in the header/footer.
 * Last Updated Date: September 22, 2026
 * @function renderHeader
 * @returns {void}
 * @author Cesar
 */
const renderHeader = () => {
    paintAvatarEl($("#adminAvatar"), ADMIN.name, ADMIN.avatarUrl);
    paintAvatarEl($("#adminAvatarMenu"), ADMIN.name, ADMIN.avatarUrl);
    $("#todayLabel").textContent = formatToday();

    const footerYear = $("#footerYear");
    if (footerYear) {
        footerYear.textContent = String(new Date().getFullYear());
    }
};

/**
 * DOCU: Lazily loads and starts the CSV export on demand.
 * Last Updated Date: September 22, 2026
 * @function wireExport
 * @returns {void}
 * @author Cesar
 */
const wireExport = () => {
    $("#exportBtn").addEventListener("click", async () => {
        try {
            const { startExport } = await import("./services/exportService.js");
            startExport();
        } catch (err) {
            console.error("Failed to load the export module:", err);
        }
    });
    $("#exportCloseBtn").addEventListener("click", () => getExportModal()?.hide());
};

/**
 * DOCU: Initializes all features and performs the first table render.
 * Last Updated Date: September 22, 2026
 * @function init
 * @returns {void}
 * @author Cesar
 */
const init = () => {
    /* Theme first: the boot script in index.html already painted the palette. */
    initThemeToggle();

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

    setTimeout(() => {
        renderAll();
    }, 450);
};

init();