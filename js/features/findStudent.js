/* =========================================================================
   Find by ID + table filters feature
   ========================================================================= */
import { $, debounce, preventLeadingSpace } from "../utils/dom.js";
import { escapeHtml } from "../utils/format.js";
import { avatarHtml } from "../components/avatar.js";
import { state, findRecord } from "../store/studentStore.js";
import { renderAll } from "./studentTable.js";

/* ------------------------- DOM element references ------------------------ */
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

/* ========================== Find by ID ============================== */
const setFindStatus = (type, message) => {
    findStatus.dataset.type = type || "";
    const icon = type === "ok" ? "bi-check2-circle" : type === "err" ? "bi-x-circle" : "bi-info-circle";
    findStatus.innerHTML = `<i class="bi ${icon} me-1" aria-hidden="true"></i>${escapeHtml(message)}`;
};

const hideFindResult = () => {
    findResult.innerHTML = "";
    findResult.hidden = true;
};

const findResultText = (r) =>
    `${avatarHtml(r.name, r.avatarUrl, "xs")}<span class="sr-find-text">${escapeHtml(r.name)} | Section ${escapeHtml(r.section)} | Average: ${r.average.toFixed(2)} | ${r.isPassed ? "Passed" : "Needs Improvement"}</span>`;

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

const clearFind = () => {
    findStudentInput.value = "";
    hideFindResult();
    setFindStatus("info", "Enter a student ID and press Find (or Enter) to view that record.");
};

/* ============================ Reset filters ========================== */
/** Reset every filter/sort to its default and re-render the table. */
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

    renderAll();
};

/* =========================== Feature init ============================ */
export const initFindStudent = () => {
    // Find by ID
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

    // Filters — never allow leading spaces in the search field
    preventLeadingSpace(searchInput);

    searchInput.addEventListener(
        "input",
        debounce(() => {
            state.search = searchInput.value.trim();
            state.page = 1;
            renderAll();
        })
    );

    [sectionFilter, remarksFilter, statusFilter].forEach((select) =>
        select.addEventListener("change", () => {
            state.section = sectionFilter.value;
            state.remarks = remarksFilter.value;
            state.status = statusFilter.value;
            state.page = 1;
            renderAll();
        })
    );

    resetFiltersBtn.addEventListener("click", resetFilters);
};