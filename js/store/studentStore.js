import { students } from "../data/students.js";
import { DEFAULT_PAGE_SIZE } from "../config/constants.js";
import { enrichStudent } from "../services/studentService.js";

/* Enriched student records (derived: average + isPassed). */
export const records = students.map(enrichStudent);

/* Dashboard UI state (filters, sorting, pagination, active dialogs). */
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

/**
 * DOCU: Returns the next free student id.
 * Last Updated Date: September 22, 2026
 * @function nextId
 * @returns {number} Next free id (max id + 1)
 * @author Cesar
 */
export const nextId = () => Math.max(...records.map((r) => r.id), 0) + 1;

/**
 * DOCU: Compares two students by the current sort key and direction.
 * Last Updated Date: September 22, 2026
 * @function compareStudents
 * @param {Object} a - First student record
 * @param {Object} b - Second student record
 * @returns {number} Negative, zero or positive per sort order
 * @author Cesar
 */
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

/**
 * DOCU: Returns the default sort direction when a column is first sorted.
 * Last Updated Date: September 22, 2026
 * @function initialSortDirFor
 * @param {string} key - The sort column key
 * @returns {string} Initial sort direction ("asc" or "desc")
 * @author Cesar
 */
export const initialSortDirFor = (key) => (key === "average" || key === "enrolled" ? "desc" : "asc");

/* Filter keyword matching: name or email, case-insensitive. */
const matchesKeyword = (r, keyword) =>
    !keyword || r.name.toLowerCase().includes(keyword) || (r.email || "").toLowerCase().includes(keyword);

/**
 * DOCU: Returns records matching all active filters, sorted.
 * Last Updated Date: September 22, 2026
 * @function filteredRecords
 * @returns {Array} Filtered and sorted student records
 * @author Cesar
 */
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

/**
 * DOCU: Finds a single enriched record by id.
 * Last Updated Date: September 22, 2026
 * @function findRecord
 * @param {number} id - Student id to look up
 * @returns {Object|undefined} The matching record, if found
 * @author Cesar
 */
export const findRecord = (id) => records.find((r) => r.id === id);