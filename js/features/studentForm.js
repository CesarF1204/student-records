import { $, preventLeadingSpace, preventAnySpace, trimOnBlur } from "../utils/dom.js";
import { paintAvatarEl } from "../components/avatar.js";
import { getStudentModal } from "../components/modals.js";
import { showToast } from "../components/toast.js";
import { records, state, nextId, findRecord } from "../store/studentStore.js";
import { renderAll } from "./studentTable.js";
import { isValidEmail, isValidAvatarUrl, isValidScore, withScores } from "../services/studentService.js";
import { resetFilters } from "./findStudent.js";

/**
 * DOCU: Returns references to all form fields.
 * Last Updated Date: September 22, 2026
 * @function formFields
 * @returns {Object} Map of form field elements
 * @author Cesar
 */
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

/**
 * DOCU: Clears all validation styling on the form.
 * Last Updated Date: September 22, 2026
 * @function clearValidation
 * @returns {void}
 * @author Cesar
 */
const clearValidation = () => {
    document.querySelectorAll("#studentForm .is-invalid, #studentForm .is-valid").forEach((el) => {
        el.classList.remove("is-invalid", "is-valid");
    });
};

/**
 * DOCU: Marks a field as valid or invalid.
 * Last Updated Date: September 22, 2026
 * @function markInvalid
 * @param {HTMLElement} el - The field to mark
 * @param {boolean} valid - Whether the field is valid
 * @returns {void}
 * @author Cesar
 */
const markInvalid = (el, valid) => {
    el.classList.remove("is-valid", "is-invalid");
    el.classList.add(valid ? "is-valid" : "is-invalid");
};

/**
 * DOCU: Refreshes the avatar preview from the current form values.
 * Last Updated Date: September 22, 2026
 * @function refreshAvatarPreview
 * @returns {void}
 * @author Cesar
 */
const refreshAvatarPreview = () => {
    const f = formFields();
    if (!f.avatarUrl) return;
    paintAvatarEl($("#avatarPreview"), f.name.value.trim() || "?", f.avatarUrl.value);
};

let formSnapshot = null;

/**
 * DOCU: Collects the current values of all form fields.
 * Last Updated Date: September 22, 2026
 * @function currentFormValues
 * @returns {Object} Current form field values
 * @author Cesar
 */
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

/**
 * DOCU: Disables Save in edit mode when nothing has changed.
 * Last Updated Date: September 22, 2026
 * @function updateSaveButtonState
 * @returns {void}
 * @author Cesar
 */
const updateSaveButtonState = () => {
    const btn = $("#saveStudentBtn");
    if (!btn) return;
    btn.disabled = Boolean(state.editingId) && formSnapshot !== null
        && JSON.stringify(currentFormValues()) === JSON.stringify(formSnapshot);
};

/**
 * DOCU: Opens the add/edit student modal for a given record.
 * Last Updated Date: September 22, 2026
 * @function openStudentModal
 * @param {number} id - Student id to edit; omit to add a new student
 * @returns {void}
 * @author Cesar
 */
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

/**
 * DOCU: Validates all form fields and marks invalid ones.
 * Last Updated Date: September 22, 2026
 * @function validateForm
 * @returns {Object} Object with `valid` flag and parsed `scores` array
 * @author Cesar
 */
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

/**
 * DOCU: Validates and saves a new or edited student.
 * Last Updated Date: September 22, 2026
 * @function saveStudent
 * @returns {void}
 * @author Cesar
 */
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

/**
 * DOCU: Wires the student form controls and input constraints.
 * Last Updated Date: September 22, 2026
 * @function initStudentForm
 * @returns {void}
 * @author Cesar
 */
export const initStudentForm = () => {
    $("#addStudentBtn").addEventListener("click", () => openStudentModal());
    $("#saveStudentBtn").addEventListener("click", saveStudent);

    $("#studentForm").addEventListener("input", updateSaveButtonState);
    $("#studentForm").addEventListener("change", updateSaveButtonState);

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
            if (avatarInput.value.trim() === "" || isValidAvatarUrl(avatarInput.value)) {
                avatarInput.classList.remove("is-invalid");
            }
        });
    }
};
