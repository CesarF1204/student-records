import { $, debounce, preventLeadingSpace } from "../utils/dom.js";
import { escapeHtml } from "../utils/format.js";
import { avatarHtml } from "../components/avatar.js";
import { state, findRecord } from "../store/studentStore.js";
import { FILTER_RENDER_DELAY_MS } from "../config/constants.js";
import { renderAll, showTableFilterLoading, hideTableFilterLoading } from "./studentTable.js";

const findStudentInput = $("#findStudentInput");
const findStudentBtn = $("#findStudentBtn");
const clearFindBtn = $("#clearFindBtn");
const findStatus = $("#findStatus");
const findResult = $("#findResult");

const searchInput = $("#studentSearch");
const sectionFilter = $("#sectionFilter");
const remarksFilter = $("#remarksFilter");
const statusFilter = $("#statusFilter");
const resetFiltersBtn = $("#resetFiltersBtn");

/**
 * DOCU: Shows a status message next to the find controls.
 * Last Updated Date: September 22, 2026
 * @function setFindStatus
 * @param {string} type - Status type (ok/err/info)
 * @param {string} message - Message to display
 * @returns {void}
 * @author Cesar
 */
const setFindStatus = (type, message) => {
    findStatus.dataset.type = type || "";
    const icon = type === "ok" ? "bi-check2-circle" : type === "err" ? "bi-x-circle" : "bi-info-circle";
    findStatus.innerHTML = `<i class="bi ${icon} me-1" aria-hidden="true"></i>${escapeHtml(message)}`;
};

/**
 * DOCU: Hides the find result panel.
 * Last Updated Date: September 22, 2026
 * @function hideFindResult
 * @returns {void}
 * @author Cesar
 */
const hideFindResult = () => {
    findResult.innerHTML = "";
    findResult.hidden = true;
};

/**
 * DOCU: Builds the HTML for a found student record.
 * Last Updated Date: September 22, 2026
 * @function findResultText
 * @param {Object} r - The found student record
 * @returns {string} Student result HTML markup
 * @author Cesar
 */
const findResultText = (r) =>
    `${avatarHtml(r.name, r.avatarUrl, "xs")}<span class="sr-find-text">${escapeHtml(r.name)} | Section ${escapeHtml(r.section)} | Average: ${r.average.toFixed(2)} | ${r.isPassed ? "Passed" : "Needs Improvement"}</span>`;

/**
 * DOCU: Looks up a student by ID and shows the result or an error.
 * Last Updated Date: September 22, 2026
 * @function applyFind
 * @returns {void}
 * @author Cesar
 */
const applyFind = () => {
    const raw = findStudentInput.value.trim();
    const id = raw === "" ? null : Number(raw);

    if (raw !== "" && (!Number.isFinite(id) || id <= 0)) {
        hideFindResult();
        setFindStatus("err", "Enter a valid student ID (e.g. 101).");
        return;
    }

    if (id == null) {
        hideFindResult();
        setFindStatus("info", "Enter a student ID and press Find (or Enter) to view that record.");
        findStudentInput.focus();
        return;
    }

    const record = findRecord(id);
    if (record) {
        findResult.innerHTML = findResultText(record);
        findResult.hidden = false;
        setFindStatus("ok", `Found student #${id}.`);
    } else {
        hideFindResult();
        setFindStatus("err", `No student matches ID ${id}.`);
    }
};

/**
 * DOCU: Clears the find input, result and status message.
 * Last Updated Date: September 22, 2026
 * @function clearFind
 * @returns {void}
 * @author Cesar
 */
const clearFind = () => {
    findStudentInput.value = "";
    hideFindResult();
    setFindStatus("info", "Enter a student ID and press Find (or Enter) to view that record.");
};

/* Tracks a debounced search plus queued filter renders so the loading
   indicator stays up until every pending change has been rendered. */
let searchPending = false;
let filterTimer = null;

/**
 * DOCU: Hides the table loading indicator only when no search or filter work is pending.
 * Last Updated Date: September 23, 2026
 * @function hideFilterLoadingWhenIdle
 * @returns {void}
 * @author Cesar
 */
const hideFilterLoadingWhenIdle = () => {
    if (!searchPending && filterTimer === null) hideTableFilterLoading();
};

/**
 * DOCU: Shows the loading indicator and renders the queued search/filter/reset
 * change after a short delay so the circular animation is actually visible
 * (filtering itself is synchronous). Rapid changes coalesce into a single render.
 * Last Updated Date: September 23, 2026
 * @function queueFilterRender
 * @returns {void}
 * @author Cesar
 */
const queueFilterRender = () => {
    showTableFilterLoading();
    clearTimeout(filterTimer);
    filterTimer = setTimeout(() => {
        filterTimer = null;
        renderAll();
        hideFilterLoadingWhenIdle();
    }, FILTER_RENDER_DELAY_MS);
};

/**
 * DOCU: Resets all filters and sorting to defaults, then re-renders through the
 * loading queue so the indicator shows while the view is refreshed.
 * Last Updated Date: September 23, 2026
 * @function resetFilters
 * @returns {void}
 * @author Cesar
 */
export const resetFilters = () => {
    state.search = "";
    state.section = "all";
    state.remarks = "all";
    state.status = "all";
    state.sortKey = "enrolled";
    state.sortDir = "desc";
    state.page = 1;

    searchInput.value = "";
    sectionFilter.value = "all";
    remarksFilter.value = "all";
    statusFilter.value = "all";

    queueFilterRender();
};

/**
 * DOCU: Wires the find-by-ID and table filter controls.
 * Last Updated Date: September 22, 2026
 * @function initFindStudent
 * @returns {void}
 * @author Cesar
 */
export const initFindStudent = () => {
    findStudentBtn.addEventListener("click", applyFind);
    clearFindBtn.addEventListener("click", clearFind);
    findStudentInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            applyFind();
        }
    });
    findStudentInput.addEventListener("input", debounce(() => {
        if (findStudentInput.value.trim() === "") clearFind();
    }, 250));

    preventLeadingSpace(searchInput);

    /**
     * DOCU: Once the debounce settles, applies the search keyword and shows the
     * loading indicator while the filtered results render.
     * Last Updated Date: September 23, 2026
     * @function applySearch
     * @returns {void}
     * @author Cesar
     */
    const applySearch = debounce(() => {
        state.search = searchInput.value.trim();
        state.page = 1;
        searchPending = false;
        queueFilterRender();
    });

    /* No loading while typing: the indicator waits for the debounce to settle,
       then queueFilterRender() shows it while the results render. */
    searchInput.addEventListener("input", () => {
        searchPending = true;
        applySearch();
    });

    [sectionFilter, remarksFilter, statusFilter].forEach((select) =>
        select.addEventListener("change", () => {
            state.section = sectionFilter.value;
            state.remarks = remarksFilter.value;
            state.status = statusFilter.value;
            state.page = 1;
            queueFilterRender();
        })
    );

    resetFiltersBtn.addEventListener("click", resetFilters);
};