/* =========================================================================
   View / Delete student modals feature
   ========================================================================= */
import { $ } from "../utils/dom.js";
import { escapeHtml, formatDate } from "../utils/format.js";
import { avatarHtml } from "../components/avatar.js";
import { getDeleteModal, getViewModal } from "../components/modals.js";
import { showToast } from "../components/toast.js";
import { records, state, findRecord, filteredRecords } from "../store/studentStore.js";
import { renderAll } from "./studentTable.js";
import { openStudentModal } from "./studentForm.js";

/* ========================== View student ============================= */
export const openViewModal = (id) => {
    const r = findRecord(id);
    if (!r) return;
    state.viewId = id;

    $("#viewModalBody").innerHTML = `
        <div class="d-flex align-items-center gap-3 mb-3">
            ${avatarHtml(r.name, r.avatarUrl, "lg")}
            <div class="min-w-0">
                <div class="h6 mb-0">${escapeHtml(r.name)}</div>
                <div class="text-muted small">${escapeHtml(r.email)}</div>
            </div>
        </div>
        <dl class="row gy-2">
            <div class="col-6"><div class="view-section-title">Details</div></div>
            <div class="col-12"></div>
            <dt class="col-4 col-sm-3">ID</dt><dd class="col-8 col-sm-9">${r.id}</dd>
            <dt class="col-4 col-sm-3">Section</dt><dd class="col-8 col-sm-9">Section ${escapeHtml(r.section)}</dd>
            <dt class="col-4 col-sm-3">Enrolled</dt><dd class="col-8 col-sm-9">${formatDate(r.enrolled)}</dd>
            <dt class="col-4 col-sm-3">Status</dt>
            <dd class="col-8 col-sm-9">
                <span class="badge badge-soft ${r.active ? "badge-soft-success" : "badge-soft-muted"}">${r.active ? "Active" : "Inactive"}</span>
            </dd>
            <div class="col-12"></div>
            <div class="col-6"><div class="view-section-title">Performance</div></div>
            <div class="col-12"></div>
            <dt class="col-4 col-sm-3">Scores</dt><dd class="col-8 col-sm-9">${r.scores.map((s) => escapeHtml(s)).join(" · ")}</dd>
            <dt class="col-4 col-sm-3">Average</dt><dd class="col-8 col-sm-9">
                <span class="${r.isPassed ? "text-success fw-bold" : "text-warning fw-bold"}">${r.average.toFixed(2)}%</span>
            </dd>
            <dt class="col-4 col-sm-3">Result</dt>
            <dd class="col-8 col-sm-9">
                <span class="badge badge-soft ${r.isPassed ? "badge-soft-success" : "badge-soft-warning"}">
                    ${r.isPassed ? "Passed" : "Needs improvement"}
                </span>
            </dd>
        </dl>`;

    getViewModal().show();
};

/* ========================= Delete student ============================ */
export const openDeleteModal = (id) => {
    const r = findRecord(id);
    if (!r) return;
    state.deleteId = id;
    $("#deleteStudentName").innerHTML = `
        <span class="sr-identity-row">
            ${avatarHtml(r.name, r.avatarUrl, "sm")}
            <span class="min-w-0">
                <span class="sr-identity-name d-block">${escapeHtml(r.name)} (ID ${r.id})</span>
                <span class="sr-identity-sub d-block">${escapeHtml(r.email)} &middot; Section ${escapeHtml(r.section)}</span>
            </span>
        </span>`;
    getDeleteModal().show();
};

const confirmDelete = () => {
    if (state.deleteId === null) return;
    const idx = records.findIndex((r) => r.id === state.deleteId);
    if (idx >= 0) {
        records.splice(idx, 1);
        const removed = state.deleteId;
        state.deleteId = null;
        if (!filteredRecords().length && state.page > 1) state.page -= 1;
        renderAll();
        showToast("Record deleted", `Student #${removed} was removed from the student records.`, "danger");
    }
    getDeleteModal().hide();
};

/* =========================== Feature init ============================ */
export const initStudentModals = () => {
    // View -> edit
    $("#viewEditBtn").addEventListener("click", () => {
        getViewModal().hide();
        setTimeout(() => openStudentModal(state.viewId), 160);
    });

    // Delete
    $("#confirmDeleteBtn").addEventListener("click", confirmDelete);
};