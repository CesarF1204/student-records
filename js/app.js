import { students } from "./students.js";

/* =========================================================================
   Student Records Dashboard — application logic
   ========================================================================= */

const PASS_THRESHOLD = 75;
const DEFAULT_PAGE_SIZE = 5;

/* ------------------------- DOM element references ------------------------ */
const $ = (sel) => document.querySelector(sel);

const statShown = $("#statShown");
const trendShown = $("#trendShown");
const statAvg = $("#statAvg");
const statPassing = $("#statPassing");

const resultRange = $("#resultRange");
const paginationEl = $("#pagination");
const tableBody = $("#studentTableBody");

const findStudentInput = $("#findStudentInput");
const findStudentBtn = $("#findStudentBtn");
const clearFindBtn = $("#clearFindBtn");
const findStatus = $("#findStatus");
const findResult = $("#findResult");

const searchInput = $("#studentSearch");
const sectionFilter = $("#sectionFilter");
const gradeFilter = $("#gradeFilter");
const statusFilter = $("#statusFilter");
const resetFiltersBtn = $("#resetFiltersBtn");

const todayLabel = $("#todayLabel");

/* ------------------------------- Tooling --------------------------------- */
const debounce = (callback, delay = 300) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => callback(...args), delay);
    };
};

const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (ch) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    })[ch]);

const formatDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso + "T00:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const initials = (name) =>
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join("");

/* --------------------------- Derived student ------------------------------ */
// Enrich the raw student with a computed average and pass flag, keeping the
// original id, name, section and scores untouched.
const records = students.map((s) => {
    const scores = [...s.scores];
    const total = scores.reduce((sum, score) => sum + score, 0);
    const average = Math.round((total / scores.length) * 100) / 100;
    return { ...s, scores, average, isPassed: average >= PASS_THRESHOLD };
});

/* ------------------------------ State ------------------------------------ */
const state = {
    search: "",
    section: "all",
    grade: "all",
    status: "all",
    sortKey: "enrolled",
    sortDir: "desc",
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    editingId: null, // student id currently in the edit form (null = adding)
    deleteId: null,  // student id pending deletion
    viewId: null,    // student id being viewed
};

const nextId = () => Math.max(...records.map((r) => r.id), 0) + 1;

/* ------------------------- Bootstrap modal helpers ----------------------- */
let studentModal, viewModal, deleteModal, toastEl;

const initBootstrap = () => {
    if (!window.bootstrap) return;
    studentModal = new bootstrap.Modal($("#studentModal"));
    viewModal = new bootstrap.Modal($("#viewStudentModal"));
    deleteModal = new bootstrap.Modal($("#deleteStudentModal"));
    toastEl = new bootstrap.Toast($("#liveToast"));
};

const showToast = (title, message, type = "info") => {
    if (!toastEl) return;
    const icons = {
        success: "bi-check-circle-fill text-success",
        danger: "bi-x-circle-fill text-danger",
        info: "bi-info-circle-fill text-primary",
    };
    $("#toastIcon").className = `bi ${icons[type] || icons.info} me-2`;
    $("#toastTitle").textContent = title;
    $("#toastBody").textContent = message;
    toastEl.show();
};
/* ============================ Summary stats ============================ */
const renderStats = () => {
    const total = records.length;
    const shown = filteredRecords().length;
    const classAvg = total ? records.reduce((sum, r) => sum + r.average, 0) / total : 0;
    const passing = records.filter((r) => r.isPassed).length;

    statShown.textContent = shown;
    statAvg.textContent = classAvg.toFixed(2) + "%";
    statPassing.textContent = passing;

    trendShown.innerHTML = `<span class="text-muted">${shown} of ${total} total</span>`;
};

/* ============================ Sorting ============================= */
const compareStudents = (a, b) => {
    const key = state.sortKey;
    let av, bv;
    switch (key) {
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
    if (av < bv) return state.sortDir === "asc" ? -1 : 1;
    if (av > bv) return state.sortDir === "asc" ? 1 : -1;
    return 0;
};

const updateSortHeaders = () => {
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

/* ========================== Filter pipeline =========================== */
const filteredRecords = () => {
    const keyword = state.search.trim().toLowerCase();

    return records
        .filter((r) => {
            const matchesKeyword =
                !keyword ||
                r.name.toLowerCase().includes(keyword) ||
                (r.email || "").toLowerCase().includes(keyword);
            const matchesSection = state.section === "all" || r.section === state.section;
            const matchesGrade = state.grade === "all" || r.grade === state.grade;
            const matchesStatus =
                state.status === "all" ||
                (state.status === "active" && r.active) ||
                (state.status === "inactive" && !r.active);
            return matchesKeyword && matchesSection && matchesGrade && matchesStatus;
        })
        .sort(compareStudents);
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
        <td class="sr-id-cell">${r.id}</td>
        <td>
            <div class="student-cell">
                <span class="avatar avatar-md">${escapeHtml(initials(r.name))}</span>
                <div class="student-meta">
                    <div class="name">${escapeHtml(r.name)}</div>
                    <div class="email">${escapeHtml(r.email)}</div>
                </div>
            </div>
        </td>
        <td><span class="badge badge-soft badge-soft-primary">${escapeHtml(r.section)}</span></td>
        <td>${escapeHtml(r.grade)}</td>
        <td>
            <div class="avg-cell ${avgClass(r.average)}" title="${r.isPassed ? "Passing" : "Needs improvement"}">
                <div class="score-list" aria-label="Scores for ${escapeHtml(r.name)}">${scoresTemplate(r)}</div>
                <strong>${r.average.toFixed(2)}%</strong>
            </div>
        </td>
        <td>
            <span class="text-nowrap">${formatDate(r.enrolled)}</span>
        </td>
        <td>
            <span class="badge badge-soft ${r.active ? "badge-soft-success" : "badge-soft-muted"}">
                ${r.active ? "Active" : "Inactive"}
            </span>
        </td>
        <td class="text-end">
            <div class="dropdown action-drop">
                <button class="btn btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown"
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

const emptyRow = () => `
    <tr>
        <td colspan="8">
            <div class="empty-state">
                <i class="bi bi-search" aria-hidden="true"></i>
                <div class="h6">No student found</div>
                <p class="mb-0">Try adjusting your filter criteria to see all records.</p>
            </div>
        </td>
    </tr>`;

const renderTable = (list) => {
    const from = (state.page - 1) * state.pageSize;
    const pageItems = list.slice(from, from + state.pageSize);

    if (pageItems.length === 0) {
        tableBody.innerHTML = emptyRow();
    } else {
        tableBody.innerHTML = pageItems.map(rowTemplate).join("");
        wireRowActions();
    }

    const shown = list.length === 0 ? 0 : from + pageItems.length;
    resultRange.textContent = list.length === 0
        ? "0 of " + records.length + " records"
        : `Showing ${from + 1}–${shown} of ${records.length} records`;

    renderPagination(list.length);
};

/* =========================== Pagination =========================== */
const renderPagination = (total) => {
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
        btn.addEventListener("click", () => openViewModal(Number(btn.dataset.view)))
    );
    tableBody.querySelectorAll("[data-edit]").forEach((btn) =>
        btn.addEventListener("click", () => openStudentModal(Number(btn.dataset.edit)))
    );
    tableBody.querySelectorAll("[data-delete]").forEach((btn) =>
        btn.addEventListener("click", () => openDeleteModal(Number(btn.dataset.delete)))
    );
};

/* ============================ Export CSV ============================= */
const exportCSV = () => {
    const header = ["ID", "Name", "Email", "Section", "Grade", "Status", "Enrolled", "Exam1", "Exam2", "Exam3", "Average", "Result"];
    const rows = records.map((r) =>
        [r.id, r.name, r.email, r.section, r.grade, r.active ? "Active" : "Inactive", r.enrolled, ...r.scores, r.average, r.isPassed ? "Passed" : "Needs improvement"]
    );
    const csv = [header, ...rows]
        .map((row) =>
            row.map((cell) => {
                const s = String(cell);
                return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
            }).join(",")
        )
        .join("\n");

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "student-records.csv";
    a.click();
    URL.revokeObjectURL(url);

    showToast("Export complete", "Student records exported as student-records.csv", "success");
};

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
    `${escapeHtml(r.name)} | Section ${escapeHtml(r.section)} | Average: ${r.average.toFixed(2)} | ${r.isPassed ? "Passed" : "Needs improvement"}`;

const applyFind = () => {
    const raw = findStudentInput.value.trim();
    const id = raw === "" ? null : Number(raw);

    if (raw !== "" && (!Number.isFinite(id) || id <= 0)) {
        hideFindResult();
        setFindStatus("err", "Enter a positive student ID (e.g. 101).");
        return;
    }

    if (id == null) {
        hideFindResult();
        setFindStatus("info", "Enter a student ID and press Find (or Enter) to view that record.");
        return;
    }

    const record = records.find((r) => r.id === id);
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

const resetFilters = () => {
    state.search = "";
    state.section = "all";
    state.grade = "all";
    state.status = "all";
    state.sortKey = "enrolled";
    state.sortDir = "desc";
    state.page = 1;

    searchInput.value = "";
    sectionFilter.value = "all";
    gradeFilter.value = "all";
    statusFilter.value = "all";

    renderAll();
};

/* ======================== Refresh everything ========================= */
const renderAll = () => {
    renderStats();
    updateSortHeaders();
    renderTable(filteredRecords());
};
/* ======================= Add / Edit student ========================== */
const formFields = () => ({
    name: $("#nameInput"),
    email: $("#emailInput"),
    section: $("#sectionInput"),
    grade: $("#gradeInput"),
    enrolled: $("#enrolledInput"),
    active: $("#activeInput"),
    score1: $("#score1"),
    score2: $("#score2"),
    score3: $("#score3"),
});

const clearValidation = () => {
    document.querySelectorAll("#studentForm .is-invalid, #studentForm .is-valid").forEach((el) => {
        el.classList.remove("is-invalid", "is-valid");
    });
};

const markInvalid = (el, valid) => {
    el.classList.remove("is-valid", "is-invalid");
    el.classList.add(valid ? "is-valid" : "is-invalid");
};

const openStudentModal = (id) => {
    clearValidation();
    const f = formFields();

    if (id) {
        const r = records.find((rec) => rec.id === id);
        if (!r) return;
        state.editingId = id;
        $("#studentModalTitle").textContent = "Edit student";
        $("#recordId").value = r.id;
        f.name.value = r.name;
        f.email.value = r.email;
        f.section.value = r.section;
        f.grade.value = r.grade;
        f.enrolled.value = r.enrolled;
        f.active.checked = r.active;
        f.score1.value = r.scores[0] || "";
        f.score2.value = r.scores[1] || "";
        f.score3.value = r.scores[2] || "";
    } else {
        state.editingId = null;
        $("#studentModalTitle").textContent = "Add student";
        $("#recordId").value = nextId();
        f.name.value = "";
        f.email.value = "";
        f.section.value = "A";
        f.grade.value = "Grade 9";
        f.enrolled.value = new Date().toISOString().slice(0, 10);
        f.active.checked = true;
        f.score1.value = "";
        f.score2.value = "";
        f.score3.value = "";
    }

    studentModal.show();
};

const validateForm = () => {
    const f = formFields();
    let valid = true;
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    markInvalid(f.name, f.name.value.trim().length >= 2);
    valid = f.name.value.trim().length >= 2 && valid;

    markInvalid(f.email, emailRe.test(f.email.value.trim()));
    valid = emailRe.test(f.email.value.trim()) && valid;

    if (!f.enrolled.value) {
        markInvalid(f.enrolled, false);
        valid = false;
    } else {
        markInvalid(f.enrolled, true);
    }

    const scores = [f.score1, f.score2, f.score3].map((input) => {
        const n = Number(input.value);
        const ok = input.value.trim() !== "" && Number.isFinite(n) && n >= 0 && n <= 100;
        markInvalid(input, ok);
        if (!ok) valid = false;
        return ok ? n : null;
    });

    return { valid, scores };
};

const saveStudent = () => {
    const f = formFields();
    const { valid, scores } = validateForm();
    if (!valid) {
        showToast("Check the form", "Please fix the highlighted fields before saving.", "danger");
        return;
    }

    const payload = {
        name: f.name.value.trim(),
        email: f.email.value.trim(),
        section: f.section.value,
        grade: f.grade.value,
        enrolled: f.enrolled.value,
        active: f.active.checked,
        scores,
    };

    if (state.editingId) {
        const idx = records.findIndex((r) => r.id === state.editingId);
        if (idx >= 0) {
            const avg = payload.scores.reduce((a, b) => a + b, 0) / payload.scores.length;
            records[idx] = {
                ...records[idx],
                ...payload,
                average: Math.round(avg * 100) / 100,
                isPassed: avg >= PASS_THRESHOLD,
            };
        }
        showToast("Record updated", `${payload.name} was updated.`, "success");
    } else {
        const total = payload.scores.reduce((a, b) => a + b, 0);
        records.push({
            ...payload,
            id: nextId(),
            average: Math.round((total / payload.scores.length) * 100) / 100,
            isPassed: total / payload.scores.length >= PASS_THRESHOLD,
        });
        showToast("Student added", `${payload.name} was added to the student records.`, "success");
    }

    studentModal.hide();
    state.page = 1;
    resetFilters();
};

/* ========================== View student ============================= */
const openViewModal = (id) => {
    const r = records.find((rec) => rec.id === id);
    if (!r) return;
    state.viewId = id;

    $("#viewModalBody").innerHTML = `
        <div class="d-flex align-items-center gap-3 mb-3">
            <span class="avatar avatar-md" style="width:48px;height:48px;font-size:1.1rem;">${escapeHtml(initials(r.name))}</span>
            <div>
                <div class="h6 mb-0">${escapeHtml(r.name)}</div>
                <div class="text-muted small">${escapeHtml(r.email)}</div>
            </div>
        </div>
        <dl class="row gy-2">
            <div class="col-6"><div class="view-section-title">Details</div></div>
            <div class="col-12"></div>
            <dt class="col-4 col-sm-3">ID</dt><dd class="col-8 col-sm-9">${r.id}</dd>
            <dt class="col-4 col-sm-3">Section</dt><dd class="col-8 col-sm-9">Section ${escapeHtml(r.section)}</dd>
            <dt class="col-4 col-sm-3">Grade</dt><dd class="col-8 col-sm-9">${escapeHtml(r.grade)}</dd>
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

    viewModal.show();
};

/* ========================= Delete student ============================ */
const openDeleteModal = (id) => {
    const r = records.find((rec) => rec.id === id);
    if (!r) return;
    state.deleteId = id;
    $("#deleteStudentName").textContent = `${r.name} (ID ${r.id})`;
    deleteModal.show();
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
    deleteModal.hide();
};

/* ========================= Event wiring ============================= */
const wireEvents = () => {
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

    // Filters
    searchInput.addEventListener(
        "input",
        debounce(() => {
            state.search = searchInput.value;
            state.page = 1;
            renderAll();
        })
    );

    [sectionFilter, gradeFilter, statusFilter].forEach((select) =>
        select.addEventListener("change", () => {
            state.section = sectionFilter.value;
            state.grade = gradeFilter.value;
            state.status = statusFilter.value;
            state.page = 1;
            renderAll();
        })
    );

    resetFiltersBtn.addEventListener("click", resetFilters);

    // Sorting
    document.querySelectorAll(".sr-sort").forEach((btn) =>
        btn.addEventListener("click", () => {
            const key = btn.dataset.sort;
            if (state.sortKey === key) {
                state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
            } else {
                state.sortKey = key;
                state.sortDir = key === "average" || key === "enrolled" ? "desc" : "asc";
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

    // Export
    $("#exportBtn").addEventListener("click", exportCSV);

    // Add / save
    $("#addStudentBtn").addEventListener("click", () => openStudentModal());
    $("#saveStudentBtn").addEventListener("click", saveStudent);

    // View -> edit
    $("#viewEditBtn").addEventListener("click", () => {
        viewModal.hide();
        setTimeout(() => openStudentModal(state.viewId), 160);
    });

    // Delete
    $("#confirmDeleteBtn").addEventListener("click", confirmDelete);
};

/* ====================== Loading state simulation ===================== */
const showLoading = () => {
    tableBody.innerHTML = Array.from({ length: 6 })
        .map(
            () => `
            <tr class="skeleton-row">
                <td colspan="8"><span class="skeleton" style="width:60%"></span></td>
            </tr>`
        )
        .join("");
};

/* ============================== Init ================================= */
const init = () => {
    initBootstrap();
    todayLabel.textContent = new Date().toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    wireEvents();
    showLoading();

    // Brief simulated load, then render.
    setTimeout(() => {
        renderAll();
    }, 450);
};

init();