/* =========================================================================
   Student store — single source of truth for records + dashboard state
   ========================================================================= */
import { students } from "../data/students.js";
import { DEFAULT_PAGE_SIZE } from "../config/constants.js";
import { enrichStudent } from "../services/studentService.js";

/** Enriched student records (derived: average + isPassed). */
export const records = students.map(enrichStudent);

/** Dashboard UI state (filters, sorting, pagination, active dialogs). */
export const state = {
    search: "",
    section: "all",
    remarks: "all",
    status: "all",
    sortKey: "enrolled",
    sortDir: "desc",
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    editingId: null, // student id currently in the edit form (null = adding)
    deleteId: null,  // student id pending deletion
    viewId: null,    // student id being viewed
};

/** Next free student id. */
export const nextId = () => Math.max(...records.map((r) => r.id), 0) + 1;

/* ------------------------------ Sorting ----------------------------------- */

/** Direction-aware comparator honouring the current state.sortKey/Dir. */
export const compareStudents = (a, b) => {
    const { sortKey, sortDir } = state;
    let av, bv;
    switch (sortKey) {
        case "name":
            av = a.name.toLowerCase();
            bv = b.name.toLowerCase();
            break;
        case "average":
            av = a.average;
            bv = b.average;
            break;
        case "enrolled":
            av = a.enrolled || "";
            bv = b.enrolled || "";
            break;
        case "id":
        default:
            av = a.id;
            bv = b.id;
            break;
    }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
};

/** Direction used when a column is sorted for the first time. */
export const initialSortDirFor = (key) => (key === "average" || key === "enrolled" ? "desc" : "asc");

/** Filter keyword handling: name or email, case-insensitive. */
const matchesKeyword = (r, keyword) =>
    !keyword || r.name.toLowerCase().includes(keyword) || (r.email || "").toLowerCase().includes(keyword);

/* --------------------------- Filter pipeline ------------------------------ */

/** Records matching every active filter, sorted per the current state. */
export const filteredRecords = () => {
    const keyword = state.search.trim().toLowerCase();

    return records
        .filter((r) => {
            const matchesSection = state.section === "all" || r.section === state.section;
            const matchesRemarks =
                state.remarks === "all" ||
                (state.remarks === "passed" && r.isPassed) ||
                (state.remarks === "needs" && !r.isPassed);
            const matchesStatus =
                state.status === "all" ||
                (state.status === "active" && r.active) ||
                (state.status === "inactive" && !r.active);
            return matchesKeyword(r, keyword) && matchesSection && matchesRemarks && matchesStatus;
        })
        .sort(compareStudents);
};

/** Find a single enriched record by id. */
export const findRecord = (id) => records.find((r) => r.id === id);