/* =========================================================================
   Student table feature
   Summary stats, row templates, empty states, pagination and the
   sorting/page-size controls around the table.
   ========================================================================= */
import { PASS_THRESHOLD } from "../config/constants.js";
import { $ } from "../utils/dom.js";
import { escapeHtml, formatDate } from "../utils/format.js";
import { avatarHtml } from "../components/avatar.js";
import { records, state, filteredRecords, initialSortDirFor } from "../store/studentStore.js";

/* ------------------------- DOM element references ------------------------ */
const statShown = $("#statShown");
const trendShown = $("#trendShown");
const statAvg = $("#statAvg");
const statPassing = $("#statPassing");

const resultRange = $("#resultRange");
const paginationEl = $("#pagination");
const tableBody = $("#studentTableBody");

/* Row actions are injected by app.js so this module stays decoupled
   from the modal features (avoids circular imports). */
let rowActions = { onView: () => {}, onEdit: () => {}, onDelete: () => {} };

/* ============================ Summary stats ============================ */
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

/* ========================== Sorting header UI ========================== */
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

/* ========================== Table rendering =========================== */
const avgClass = (average) => (average >= PASS_THRESHOLD ? "avg-good" : "avg-bad");

const scoreClass = (score) => (score >= PASS_THRESHOLD ? "score-pass" : "score-fail");

const scoresTemplate = (r) =>
    r.scores
        .map(
            (s) =>
                `<span class="score-box ${scoreClass(s)}" title="${
                    s >= PASS_THRESHOLD ? "Passing" : "Failing"
                } (${escapeHtml(s)} vs passing ${PASS_THRESHOLD})">${escapeHtml(s)}</span>`
        )
        .join("");

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
        : `Showing ${from + 1} – ${shown} of ${records.length} records`;

    renderPagination(list.length);
};

/* =========================== Pagination =========================== */
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

/* ======================= Row action wiring ========================= */
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

/* ======================= Refresh everything ========================= */
export const renderAll = () => {
    renderStats();
    updateSortHeaders();
    renderTable(filteredRecords());
};

/* ====================== Loading state simulation ===================== */
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

/* =========================== Feature init ============================ */
/**
 * Wire the table controls (sorting, rows-per-page) and register the
 * row-action handlers (view/edit/delete) provided by the app.
 */
export const initStudentTable = (handlers = {}) => {
    rowActions = { ...rowActions, ...handlers };

    // Sorting
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

    // Rows per page
    $("#pageSizeSelect").addEventListener("change", () => {
        state.pageSize = Number($("#pageSizeSelect").value);
        state.page = 1;
        renderAll();
    });
};
