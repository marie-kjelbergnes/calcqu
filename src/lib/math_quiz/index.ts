import katex from "katex";
import { ComputeEngine } from "@cortex-js/compute-engine";
import data from "./questions.json";

export interface MathQuestion {
    id: string;
    /** Question text, with inline math in $...$ and display math in $$...$$ */
    text: string;
    /** Correct answer as LaTeX, must evaluate to a number (complex numbers allowed) */
    answer: string;
    /** Optional picture shown with the question, e.g. "/math123/eigen-01.png" (put the file in static/) */
    image?: string;
    imageAlt?: string;
}

export interface MathCategory {
    id: string;
    name: string;
    questions: MathQuestion[];
}

export const categories = data.categories as MathCategory[];

// separate engine, so variables assigned elsewhere on the site don't leak into grading
const ce = new ComputeEngine();

function to_complex(latex: string): [number, number] | null {
    const value = ce.parse(latex).N();
    if (value.unknowns.length !== 0) return null;
    const re = value.re;
    const im = value.im ?? 0;
    if (!Number.isFinite(re) || !Number.isFinite(im)) return null;
    return [re, im];
}

export type Verdict = "correct" | "close" | "wrong" | "invalid";

/** Compares the numeric values of the input and the answer, so that e.g. \frac{1}{2} and 0.5 are equal */
export function grade(input: string, answer: string): Verdict {
    const given = to_complex(input);
    const expected = to_complex(answer);
    if (!given || !expected) return "invalid";
    const distance = Math.hypot(given[0] - expected[0], given[1] - expected[1]);
    const scale = Math.max(1, Math.hypot(expected[0], expected[1]));
    if (distance <= 1e-9 * scale) return "correct";
    if (distance <= 1e-3 * scale) return "close";
    return "wrong";
}

function escape_html(text: string) {
    return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/** Renders text containing $inline$ and $$display$$ math to html */
export function render_text(text: string) {
    return text
        .split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g)
        .map((part) => {
            if (part.startsWith("$$")) {
                return katex.renderToString(part.slice(2, -2), { throwOnError: false, displayMode: true });
            }
            if (part.startsWith("$") && part.length > 1) {
                return katex.renderToString(part.slice(1, -1), { throwOnError: false });
            }
            return escape_html(part);
        })
        .join("");
}

export type Status = "correct" | "wrong" | "revealed";

export interface Result {
    status: Status;
    attempts: number;
}

/** Result per question id */
export type Results = Record<string, Result>;

const STORAGE_KEY = "calcqu-math123-results";

export function loadResults(): Results {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    } catch {
        return {};
    }
}

export function saveResults(results: Results) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
    } catch {
        // storage unavailable, results only live for this session
    }
}
