/* =========================================================================
   Add / Edit student form feature
   Form fields, validation, avatar preview, modal lifecycle and saving.
   ========================================================================= */
import { $, preventLeadingSpace, preventAnySpace, trimOnBlur } from "../utils/dom.js";
import { paintAvatarEl } from "../components/avatar.js";
import { getStudentModal } from "../components/modals.js";
import { showToast } from "../components/toast.js";
import { records, state, nextId, findRecord } from "../store/studentStore.js";
import { renderAll } from "./studentTable.js";
import { isValidEmail, isValidAvatarUrl, isValidScore, withScores } from "../services/studentService.js";
import { resetFilters } from "./findStudent.js";

const formFields = () => ({
    name: $("#nameInput"),
    email: $("#emailInput"),
    avatarUrl: $("#avatarInput"),
    section: $("#sectionInput"),
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

const refreshAvatarPreview = () => {
    const f = formFields();
    if (!f.avatarUrl) return;
    paintAvatarEl($("#avatarPreview"), f.name.value.trim() || "?", f.avatarUrl.value);
};

/* ------- Enable "Save student" only when form has changes (edit mode) ------- */
let formSnapshot = null;

const currentFormValues = () => {
    const f = formFields();
    return {
        name: f.name.value,
        email: f.email.value,
        avatarUrl: f.avatarUrl.value,
        section: f.section.value,
        enrolled: f.enrolled.value,
        active: f.active.checked,
        score1: f.score1.value,
        score2: f.score2.value,
        score3: f.score3.value,
    };
};

const updateSaveButtonState = () => {
    const btn = $("#saveStudentBtn");
    if (!btn) return;
    // Only apply the "no changes" rule when editing an existing record.
    btn.disabled = Boolean(state.editingId) && formSnapshot !== null
        && JSON.stringify(currentFormValues()) === JSON.stringify(formSnapshot);
};

export const openStudentModal = (id) => {
    clearValidation();
    const f = formFields();

    if (id) {
        const r = findRecord(id);
        if (!r) return;
        state.editingId = id;
        $("#studentModalTitle").textContent = "Edit student";
        $("#saveStudentBtn").innerHTML = '<i class="bi bi-check2 me-1" aria-hidden="true"></i>Save student';
        $("#recordId").value = r.id;
        f.name.value = r.name;
        f.email.value = r.email;
        f.avatarUrl.value = r.avatarUrl ?? "";
        f.section.value = r.section;
        f.enrolled.value = r.enrolled;
        f.active.checked = r.active;
        f.score1.value = r.scores[0] || "";
        f.score2.value = r.scores[1] || "";
        f.score3.value = r.scores[2] || "";
    } else {
        state.editingId = null;
        $("#studentModalTitle").textContent = "Add student";
        $("#saveStudentBtn").innerHTML = '<i class="bi bi-check2 me-1" aria-hidden="true"></i>Add student';
        $("#recordId").value = nextId();
        f.name.value = "";
        f.email.value = "";
        f.avatarUrl.value = "";
        f.section.value = "A";
        f.enrolled.value = new Date().toISOString().slice(0, 10);
        f.active.checked = true;
        f.score1.value = "";
        f.score2.value = "";
        f.score3.value = "";
    }

    refreshAvatarPreview();
    formSnapshot = currentFormValues();
    updateSaveButtonState();
    getStudentModal().show();
};

const validateForm = () => {
    const f = formFields();
    let valid = true;

    markInvalid(f.name, f.name.value.trim().length >= 2);
    valid = f.name.value.trim().length >= 2 && valid;

    markInvalid(f.email, isValidEmail(f.email.value));
    valid = isValidEmail(f.email.value) && valid;

    const avatarOk = isValidAvatarUrl(f.avatarUrl.value);
    markInvalid(f.avatarUrl, avatarOk);
    valid = avatarOk && valid;

    if (!f.enrolled.value) {
        markInvalid(f.enrolled, false);
        valid = false;
    } else {
        markInvalid(f.enrolled, true);
    }

    const scores = [f.score1, f.score2, f.score3].map((input) => {
        const ok = isValidScore(input.value);
        markInvalid(input, ok);
        if (!ok) valid = false;
        return ok ? Number(input.value) : null;
    });

    return { valid, scores };
};

export const saveStudent = () => {
    const f = formFields();
    const { valid, scores } = validateForm();
    if (!valid) {
        showToast("Check the form", "Please fix the highlighted fields before saving.", "danger");
        return;
    }

    const payload = {
        name: f.name.value.trim(),
        email: f.email.value.trim(),
        avatarUrl: f.avatarUrl.value.trim(),
        section: f.section.value,
        enrolled: f.enrolled.value,
        active: f.active.checked,
        scores,
    };

    if (state.editingId) {
        const idx = records.findIndex((r) => r.id === state.editingId);
        if (idx >= 0) {
            records[idx] = withScores({ ...records[idx], ...payload }, payload.scores);
        }
        showToast("Record updated", `${payload.name} was updated.`, "success");
        renderAll();
    } else {
        records.push(withScores({ ...payload, id: nextId() }, payload.scores));
        showToast("Student added", `${payload.name} was added to the student records.`, "success");
        resetFilters();
    }

    getStudentModal().hide();
};

/* =========================== Feature init ============================ */
export const initStudentForm = () => {
    // Add / save
    $("#addStudentBtn").addEventListener("click", () => openStudentModal());
    $("#saveStudentBtn").addEventListener("click", saveStudent);

    // Re-evaluate Save button state whenever any form field changes
    $("#studentForm").addEventListener("input", updateSaveButtonState);
    $("#studentForm").addEventListener("change", updateSaveButtonState);

    // Add/Edit modal: Full name (no leading space) + Email (no spaces at all)
    const nameInput = $("#nameInput");
    if (nameInput) {
        preventLeadingSpace(nameInput);
        trimOnBlur(nameInput);
        nameInput.addEventListener("input", refreshAvatarPreview);
    }
    const emailInput = $("#emailInput");
    if (emailInput) {
        preventAnySpace(emailInput);
        trimOnBlur(emailInput);
    }
    const avatarInput = $("#avatarInput");
    if (avatarInput) {
        preventAnySpace(avatarInput);
        trimOnBlur(avatarInput);
        avatarInput.addEventListener("input", () => {
            refreshAvatarPreview();
            // Live validation feel without blocking typing a URL.
            if (avatarInput.value.trim() === "" || isValidAvatarUrl(avatarInput.value)) {
                avatarInput.classList.remove("is-invalid");
            }
        });
    }
};
