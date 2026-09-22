import { PASS_THRESHOLD } from "../config/constants.js";

/**
 * DOCU: Computes the rounded average of an array of scores.
 * Last Updated Date: September 22, 2026
 * @function computeAverage
 * @param {Array} scores - Exam scores to average
 * @returns {number} Average rounded to 2 decimals
 * @author Cesar
 */
export const computeAverage = (scores) => {
    const total = scores.reduce((sum, score) => sum + score, 0);
    return Math.round((total / scores.length) * 100) / 100;
};

/**
 * DOCU: Checks whether an average meets the passing threshold.
 * Last Updated Date: September 22, 2026
 * @function isPassing
 * @param {number} average - The student's average score
 * @returns {boolean} True if the average is passing
 * @author Cesar
 */
export const isPassing = (average) => average >= PASS_THRESHOLD;

/**
 * DOCU: Adds average and pass flag to a raw student record.
 * Last Updated Date: September 22, 2026
 * @function enrichStudent
 * @param {Object} s - The raw student record
 * @returns {Object} Enriched student with average and isPassed
 * @author Cesar
 */
export const enrichStudent = (s) => {
    const scores = [...s.scores];
    const average = computeAverage(scores);
    return { ...s, scores, average, isPassed: isPassing(average) };
};

/**
 * DOCU: Returns the next free student id for a list of records.
 * Last Updated Date: September 22, 2026
 * @function nextIdOf
 * @param {Array} records - Student records to scan
 * @returns {number} Next free id (max id + 1)
 * @author Cesar
 */
export const nextIdOf = (records) => Math.max(...records.map((r) => r.id), 0) + 1;

/**
 * DOCU: Rebuilds the derived fields for a record's new scores.
 * Last Updated Date: September 22, 2026
 * @function withScores
 * @param {Object} record - An already enriched student record
 * @param {Array} scores - New exam scores
 * @returns {Object} Record with updated average and isPassed
 * @author Cesar
 */
export const withScores = (record, scores) => {
    const average = computeAverage(scores);
    return { ...record, scores, average, isPassed: isPassing(average) };
};

// Valid emails never contain spaces.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * DOCU: Checks whether an email address is valid.
 * Last Updated Date: September 22, 2026
 * @function isValidEmail
 * @param {string} value - The email to validate
 * @returns {boolean} True if the email is valid
 * @author Cesar
 */
export const isValidEmail = (value) => EMAIL_RE.test(String(value ?? "").trim());

/**
 * DOCU: Checks whether an avatar URL is optional-or-http(s) valid.
 * Last Updated Date: September 22, 2026
 * @function isValidAvatarUrl
 * @param {string} value - The avatar URL to validate
 * @returns {boolean} True if empty or a valid http(s) URL
 * @author Cesar
 */
export const isValidAvatarUrl = (value) => {
    const clean = String(value ?? "").trim();
    if (!clean) return true;
    try {
        const url = new URL(clean);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
};

/**
 * DOCU: Checks whether a single exam score is valid.
 * Last Updated Date: September 22, 2026
 * @function isValidScore
 * @param {string} value - The score value to validate
 * @returns {boolean} True if the score is between 0 and 100
 * @author Cesar
 */
export const isValidScore = (value) => {
    const n = Number(value);
    return String(value).trim() !== "" && Number.isFinite(n) && n >= 0 && n <= 100;
};