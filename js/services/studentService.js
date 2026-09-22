/* =========================================================================
   Student service — pure business logic (no DOM access)
   ========================================================================= */
import { PASS_THRESHOLD } from "../config/constants.js";

/** Rounded average (2 decimals) of an array of scores. */
export const computeAverage = (scores) => {
    const total = scores.reduce((sum, score) => sum + score, 0);
    return Math.round((total / scores.length) * 100) / 100;
};

/** Whether the rounded average meets the passing threshold. */
export const isPassing = (average) => average >= PASS_THRESHOLD;

/**
 * Enrich a raw student with a computed average and pass flag, keeping the
 * original id, name, section and scores untouched (scores are copied).
 */
export const enrichStudent = (s) => {
    const scores = [...s.scores];
    const average = computeAverage(scores);
    return { ...s, scores, average, isPassed: isPassing(average) };
};

/** Next free student id for a list of records (max id + 1). */
export const nextIdOf = (records) => Math.max(...records.map((r) => r.id), 0) + 1;

/** Rebuild the derived fields for an already enriched record's new scores. */
export const withScores = (record, scores) => {
    const average = computeAverage(scores);
    return { ...record, scores, average, isPassed: isPassing(average) };
};

/* ------------------------------ Validation -------------------------------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value) => EMAIL_RE.test(String(value ?? "").trim());

/** Avatar URLs are optional; when present they must be http(s). */
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

/** A single exam score: required integer-like number between 0 and 100. */
export const isValidScore = (value) => {
    const n = Number(value);
    return String(value).trim() !== "" && Number.isFinite(n) && n >= 0 && n <= 100;
};