import data from './questions.json';

export type Letter = 'A' | 'B' | 'C' | 'D';

export interface Question {
	question: string;
	options: string[];
	answer: Letter;
	/** Optional picture shown with the question, e.g. "/mcq/filters-27.png" (put the file in static/mcq/) */
	image?: string;
	imageAlt?: string;
	/** Optional remark shown after the question is answered */
	note?: string;
}

export interface Category {
	id: string;
	name: string;
	questions: Question[];
}

export const categories = data.categories as Category[];

export const letters: Letter[] = ['A', 'B', 'C', 'D'];

/** Chosen answer per category id, per question index */
export type Results = Record<string, Record<number, Letter>>;

const STORAGE_KEY = 'calcqu-mcq-results';

export function loadResults(): Results {
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
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
