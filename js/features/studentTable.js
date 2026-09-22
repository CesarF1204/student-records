import { PASS_THRESHOLD } from "../config/constants.js";
import { $ } from "../utils/dom.js";
import { escapeHtml, formatDate } from "../utils/format.js";
import { avatarHtml } from "../components/avatar.js";
import { records, state, filteredRecords, initialSortDirFor } from "../store/studentStore.js";

const statShown = $("#statShown");
const trendShown = $("#trendShown");
const statAvg = $("#statAvg");
const statPassing = $("#statPassing");

const resultRange = $("#resultRange");
const paginationEl = $("#pagination");
const tableBody = $("#studentTableBody");

/* Row actions are injected by app.js to avoid circular imports. */
let rowActions = { onView: () => {}, onEdit: () => {}, onDelete: () => {} };

/**
 * DOCU: Renders the summary stat cards above the table.
 * Last Updated Date: September 22, 2026
 * @function renderStats
 * @returns {void} 
 * @author Cesar
 */
export const renderStats = () => {
    const total = records.length;
    const shown = filteredRecords().length;
    const classAvg = total ? records.reduce((sum, r) => sum + r.average, 0) / total : 0;
    const passing = records.filter((r) => r.isPassed).length;

    statShown.textContent = shown;
    statAvg.textContent = classAvg.toFixed(2) + "%";
    statPassing.textContent = `${passing} of ${total}`;

    trendShown.innerHTML = `<span class="text-muted">${shown} of ${total} total</span>`;
};

/**
 * DOCU: Updates the sort direction icons and aria-sort attributes.
 * Last Updated Date: September 22, 2026
 * @function updateSortHeaders
 * @returns {void} 
 * @author Cesar
 */
export const updateSortHeaders = () => {
    document.querySelectorAll(".sr-sort").forEach((btn) => {
        const key = btn.dataset.sort;
        const icon = btn.querySelector(".sort-icon");
        if (state.sortKey === key) {
            btn.setAttribute("aria-sort", state.sortDir === "asc" ? "ascending" : "descending");
            icon.className = `bi small ms-1 sort-icon ${
                state.sortDir === "asc" ? "bi-arrow-up" : "bi-arrow-down"
            }`;
        } else {
            btn.setAttribute("aria-sort", "none");
            icon.className = "bi bi-arrow-down-up small ms-1 sort-icon";
        }
    });
};

/**
 * DOCU: Returns the CSS class for an average score.
 * Last Updated Date: September 22, 2026
 * @function avgClass
 * @param {number} average - The student average score
 * @returns {string} CSS class for the average
 * @author Cesar
 */
const avgClass = (average) => (average >= PASS_THRESHOLD ? "avg-good" : "avg-bad");

/**
 * DOCU: Returns the CSS class for a single score.
 * Last Updated Date: September 22, 2026
 * @function scoreClass
 * @param {number} score - A single exam score
 * @returns {string} CSS class for the score
 * @author Cesar
 */
const scoreClass = (score) => (score >= PASS_THRESHOLD ? "score-pass" : "score-fail");

/**
 * DOCU: Builds the score boxes markup for a student row.
 * Last Updated Date: September 22, 2026
 * @function scoresTemplate
 * @param {Object} r - The student record
 * @returns {string} Score boxes HTML markup
 * @author Cesar
 */
const scoresTemplate = (r) =>
    r.scores
        .map(
            (s) =>
                `<span class="score-box ${scoreClass(s)}" title="${
                    s >= PASS_THRESHOLD ? "Passing" : "Failing"
                } (${escapeHtml(s)} vs passing ${PASS_THRESHOLD})">${escapeHtml(s)}</span>`
        )
        .join("");

/**
 * DOCU: Builds the HTML for one student row.
 * Last Updated Date: September 22, 2026
 * @function rowTemplate
 * @param {Object} r - The student record
 * @returns {string} Table row HTML markup
 * @author Cesar
 */
const rowTemplate = (r) => `
    <tr>
        <td class="sr-id-cell" data-label="ID">#${r.id}</td>
        <td data-label="Student">
            <div class="student-cell">
                ${avatarHtml(r.name, r.avatarUrl, "md")}
                <div class="student-meta">
                    <div class="name">${escapeHtml(r.name)}</div>
                    <div class="email">${escapeHtml(r.email)}</div>
                </div>
            </div>
        </td>
        <td data-label="Section"><span class="badge badge-soft badge-soft-primary">${escapeHtml(r.section)}</span></td>
        <td data-label="Scores / Avg">
            <div class="avg-cell ${avgClass(r.average)}" title="${r.isPassed ? "Passing" : "Needs improvement"}">
                <div class="score-list" aria-label="Scores for ${escapeHtml(r.name)}">${scoresTemplate(r)}</div>
                <strong>${r.average.toFixed(2)}%</strong>
            </div>
        </td>
        <td data-label="Remarks">
            <span class="badge badge-soft ${r.isPassed ? "badge-soft-success" : "badge-soft-warning"}">
                ${r.isPassed ? "Passed" : "Needs Improvement"}
            </span>
        </td>
        <td data-label="Enrolled">
            <span class="text-nowrap sr-enrolled-date">${formatDate(r.enrolled)}</span>
        </td>
        <td data-label="Status">
            <span class="badge badge-soft ${r.active ? "badge-soft-success" : "badge-soft-muted"}">
                ${r.active ? "Active" : "Inactive"}
            </span>
        </td>
        <td class="text-end sr-actions-cell" data-label="">
            <div class="dropdown action-drop">
                <button class="btn btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown"
                    data-bs-boundary="viewport" data-bs-popper-config='{"strategy":"fixed"}'
                    aria-expanded="false" aria-label="Actions for ${escapeHtml(r.name)}">
                    <i class="bi bi-three-dots-vertical" aria-hidden="true"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                    <li><button class="dropdown-item" type="button" data-view="${r.id}">
                        <i class="bi bi-eye me-2" aria-hidden="true"></i>View</button></li>
                    <li><button class="dropdown-item" type="button" data-edit="${r.id}">
                        <i class="bi bi-pencil me-2" aria-hidden="true"></i>Edit</button></li>
                    <li><hr class="dropdown-divider" /></li>
                    <li><button class="dropdown-item text-danger" type="button" data-delete="${r.id}">
                        <i class="bi bi-trash3 me-2" aria-hidden="true"></i>Delete</button></li>
                </ul>
            </div>
        </td>
    </tr>`;

/**
 * DOCU: Builds the empty-state row shown when filters match nothing.
 * Last Updated Date: September 22, 2026
 * @function emptyNoResultsRow
 * @returns {string} Empty-state table row HTML
 * @author Cesar
 */
const emptyNoResultsRow = () => `
    <tr>
        <td colspan="8">
            <div class="empty-state" role="status">
                <i class="bi bi-search" aria-hidden="true"></i>
                <div class="h6">No student found</div>
                <p class="mb-0">Try adjusting your filter criteria to see all records.</p>
            </div>
        </td>
    </tr>`;

/**
 * DOCU: Builds the empty-state row shown when there are no records.
 * Last Updated Date: September 22, 2026
 * @function emptyNoDataRow
 * @returns {string} Empty-state table row HTML
 * @author Cesar
 */
const emptyNoDataRow = () => `
    <tr>
        <td colspan="8">
            <div class="empty-state" role="status">
                <i class="bi bi-mortarboard" aria-hidden="true"></i>
                <div class="h6">No student records yet</div>
                <p class="mb-0">Create student record now.</p>
            </div>
        </td>
    </tr>`;

/**
 * DOCU: Renders the current page of student rows.
 * Last Updated Date: September 22, 2026
 * @function renderTable
 * @param {Array} list - Filtered student records to render
 * @returns {void}
 * @author Cesar
 */
export const renderTable = (list) => {
    const from = (state.page - 1) * state.pageSize;
    const pageItems = list.slice(from, from + state.pageSize);

    if (records.length === 0) {
        tableBody.innerHTML = emptyNoDataRow();
    } else if (pageItems.length === 0) {
        tableBody.innerHTML = emptyNoResultsRow();
    } else {
        tableBody.innerHTML = pageItems.map(rowTemplate).join("");
        wireRowActions();
    }

    const shown = list.length === 0 ? 0 : from + pageItems.length;
    resultRange.textContent = list.length === 0
        ? "0 of " + records.length + " records"
        : `Showing ${from + 1} â€“ ${shown} of ${records.length} records`;

    renderPagination(list.length);
};

/**
 * DOCU: Renders the pagination controls for the current page count.
 * Last Updated Date: September 22, 2026
 * @function renderPagination
 * @param {number} total - Total number of filtered records
 * @returns {void} 
 * @author Cesar
 */
export const renderPagination = (total) => {
    const pages = Math.max(1, Math.ceil(total / state.pageSize));
    if (state.page > pages) state.page = pages;

    const start = Math.max(1, Math.min(state.page - 2, pages - 4));
    const end = Math.min(pages, start + 4);

    let items = `
        <li class="page-item ${state.page <= 1 ? "disabled" : ""}">
            <a class="page-link" href="#" data-page="${state.page - 1}" aria-label="Previous page">
                <i class="bi bi-chevron-left" aria-hidden="true"></i>
            </a>
        </li>`;

    for (let p = start; p <= end; p++) {
        items += `
            <li class="page-item ${p === state.page ? "active" : ""}" ${p === state.page ? 'aria-current="page"' : ""}>
                <a class="page-link" href="#" data-page="${p}">${p}</a>
            </li>`;
    }

    items += `
        <li class="page-item ${state.page >= pages ? "disabled" : ""}">
            <a class="page-link" href="#" data-page="${state.page + 1}" aria-label="Next page">
                <i class="bi bi-chevron-right" aria-hidden="true"></i>
            </a>
        </li>`;

    paginationEl.innerHTML = items;
    paginationEl.querySelectorAll(".page-link").forEach((link) =>
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const page = parseInt(link.dataset.page, 10);
            if (page >= 1 && page <= pages && page !== state.page) {
                state.page = page;
                renderTable(filteredRecords());
            }
        })
    );
};

/**
 * DOCU: Attaches click handlers to each row action button.
 * Last Updated Date: September 22, 2026
 * @function wireRowActions
 * @returns {void} 
 * @author Cesar
 */
const wireRowActions = () => {
    tableBody.querySelectorAll("[data-view]").forEach((btn) =>
        btn.addEventListener("click", () => rowActions.onView(Number(btn.dataset.view)))
    );
    tableBody.querySelectorAll("[data-edit]").forEach((btn) =>
        btn.addEventListener("click", () => rowActions.onEdit(Number(btn.dataset.edit)))
    );
    tableBody.querySelectorAll("[data-delete]").forEach((btn) =>
        btn.addEventListener("click", () => rowActions.onDelete(Number(btn.dataset.delete)))
    );
};

/**
 * DOCU: Refreshes the stats, sort headers and table.
 * Last Updated Date: September 22, 2026
 * @function renderAll
 * @returns {void} 
 * @author Cesar
 */
export const renderAll = () => {
    renderStats();
    updateSortHeaders();
    renderTable(filteredRecords());
};

/**
 * DOCU: Shows skeleton rows while the table is loading.
 * Last Updated Date: September 22, 2026
 * @function showTableLoading
 * @returns {void} 
 * @author Cesar
 */
export const showTableLoading = () => {
    tableBody.innerHTML = Array.from({ length: 6 })
        .map(
            () => `
            <tr class="skeleton-row">
                <td colspan="8"><span class="skeleton" style="width:60%"></span></td>
            </tr>`
        )
        .join("");
};

/**
 * DOCU: Wires the table controls and registers row-action handlers.
 * Last Updated Date: September 22, 2026
 * @function initStudentTable
 * @param {Object} handlers - View/edit/delete handlers from app.js
 * @returns {void}
 * @author Cesar
 */
export const initStudentTable = (handlers = {}) => {
    rowActions = { ...rowActions, ...handlers };

    document.querySelectorAll(".sr-sort").forEach((btn) =>
        btn.addEventListener("click", () => {
            const key = btn.dataset.sort;
            if (state.sortKey === key) {
                state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
            } else {
                state.sortKey = key;
                state.sortDir = initialSortDirFor(key);
            }
            state.page = 1;
            renderAll();
        })
    );

    $("#pageSizeSelect").addEventListener("change", () => {
        state.pageSize = Number($("#pageSizeSelect").value);
        state.page = 1;
        renderAll();
    });
};
