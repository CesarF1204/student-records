import { students } from "./students.js";

const searchInput = document.querySelector("#searchInput");
const sectionFilter = document.querySelector("#sectionFilter");
const statusFilter = document.querySelector("#statusFilter");
const studentTableBody = document.querySelector("#studentTableBody");
const resultCount = document.querySelector("#resultCount");
const classAverageText = document.querySelector("#classAverage");
const passingSummary = document.querySelector("#passingSummary");
const studentIdInput = document.querySelector("#studentIdInput");
const findStudentBtn = document.querySelector("#findStudentBtn");
const lookupResult = document.querySelector("#lookupResult");

// Delay (in milliseconds) to wait for the user to stop typing before a search runs.
const DEBOUNCE_DELAY = 1500;

/**
 * Returns a debounced version of `callback`.
 *
 * The returned wrapper postpones invoking `callback` until `delay` milliseconds
 * have passed since the last call. Rapid successive calls (e.g. keystrokes)
 * clear the pending timer, so only the latest invocation is ever executed.
 */
const debounce = (callback, delay = DEBOUNCE_DELAY) => {
    let timer;

    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => callback(...args), delay);
    };
};

const calculateAverage = (scores) => {
    const total = scores.reduce((sum, score) => sum + score, 0);

    return total / scores.length;
};

const studentRecords = students.map((student) => {
    const average = calculateAverage(student.scores);

    return {
        ...student,
        average,
        isPassed: average >= 75,
    };
});

const renderStudents = (items) => {
    resultCount.textContent = `${items.length} student(s) shown`;

    studentTableBody.innerHTML = items
        .map((student) => {
            const { id, name, section, scores, average, isPassed } = student;
            
            return ` 
                <tr> 
                    <td>${id}</td> 
                    <td>${name}</td> 
                    <td>${section}</td> 
                    <td>${scores.join(", ")}</td> 
                    <td>${average.toFixed(2)}</td> 
                    <td class="${isPassed ? "status-pass" : "status-fail"}"> 
                        ${isPassed ? "Passed" : "Needs Improvement"} 
                    </td> 
                </tr> 
                `;
            })
        .join("");
};

const renderSummary = () => {
    const totalAverage = studentRecords.reduce(
        (sum, student) => sum + student.average,
        0,
    );

    const classAverage = totalAverage / studentRecords.length;

    const passedCount = studentRecords.filter(
        (student) => student.isPassed,
    ).length;

    classAverageText.textContent = `Class Average: ${classAverage.toFixed(2)}`;

    passingSummary.textContent = `Passing Students: ${passedCount} of ${studentRecords.length}`;
};

const applyFilters = () => {
    const keyword = searchInput.value.trim().toLowerCase();
    const section = sectionFilter.value;
    const status = statusFilter.value;

    const results = studentRecords.filter((student) => {
        const matchesName = student.name.toLowerCase().includes(keyword);

        const matchesSection = section === "all" || student.section === section;

        const matchesStatus =
            status === "all" ||
            (status === "passed" && student.isPassed) ||
            (status === "failed" && !student.isPassed);

        return matchesName && matchesSection && matchesStatus;
    });

    renderStudents(results);
};

const findStudentById = (id) => {
    return studentRecords.find((student) => student.id === id);
};

const handleStudentLookup = () => {
    const id = Number(studentIdInput.value);
    const student = findStudentById(id);

    if (!student) {
        lookupResult.textContent = "Student not found.";
        return;
    }

    lookupResult.textContent =
        `${student.name} | Section ${student.section} | ` +
        `Average: ${student.average.toFixed(2)} | ` +
        `${student.isPassed ? "Passed" : "Needs Improvement"}`;
};

// The name search field is debounced — only run after the user stops typing.
const debouncedApplyFilters = debounce(applyFilters);

searchInput.addEventListener("input", debouncedApplyFilters);
sectionFilter.addEventListener("change", applyFilters);
statusFilter.addEventListener("change", applyFilters);

// The ID lookup is intentionally NOT debounced — it runs on button click only.
findStudentBtn.addEventListener("click", handleStudentLookup);

renderStudents(studentRecords);
renderSummary();
