import quizzes from './questions.json';
import exams from './exams.json';
import lessons from './lessons.json';

export type Letter = string;

/** Text fields may contain $inline$ and $$display$$ LaTeX */
interface Base {
	question: string;
	/** Optional picture shown with the question, e.g. "/mcq/filters-27.png" (put the file in static/mcq/) */
	image?: string;
	imageAlt?: string;
	/** Optional remark shown after the question is answered */
	note?: string;
	/** Points the question is worth in an exam, defaults to 1 */
	points?: number;
}

/** One correct option, answered with a single click */
export interface SingleQuestion extends Base {
	type?: 'single';
	options: string[];
	answer: Letter;
}

/** Any number of correct options, all of them must be selected */
export interface MultiQuestion extends Base {
	type: 'multi';
	options: string[];
	answer: Letter[];
}

export interface TrueFalseQuestion extends Base {
	type: 'truefalse';
	statements: string[];
	answer: boolean[];
}

export interface MatchItem {
	text?: string;
	image?: string;
	imageAlt?: string;
}

/** Connect each item to one of the choices */
export interface MatchQuestion extends Base {
	type: 'match';
	items: MatchItem[];
	choices: MatchItem[];
	/** Index into choices for each item */
	answer: number[];
}

/** Numeric blanks to fill in */
export interface FillQuestion extends Base {
	type: 'fill';
	blanks: string[];
	answer: number[];
	/** Absolute error accepted as correct */
	tolerance?: number;
}

/** Free text, compared to a model answer by the student */
export interface WrittenQuestion extends Base {
	type: 'written';
	answer: string;
}

export type Question = SingleQuestion | MultiQuestion | TrueFalseQuestion | MatchQuestion | FillQuestion | WrittenQuestion;

export interface Category {
	id: string;
	name: string;
	/** Heading the category is listed under */
	group: string;
	description?: string;
	questions: Question[];
	/** Optional walkthrough shown before the quiz */
	lesson?: LessonStep[];
}

export type { LessonCheck, LessonStep } from '$lib/lesson';
import type { LessonStep } from '$lib/lesson';

const lesson_by_id = lessons as Record<string, LessonStep[]>;

/** INF250 categories, with the walkthrough for each lecture topic attached */
export const categories = ([...quizzes.categories, ...exams.categories] as Category[]).map((c) => ({
	...c,
	lesson: lesson_by_id[c.id]
}));

/** Categories grouped by their heading, in the order the groups first appear */
export function group_categories(list: Category[]) {
	const groups = new Map<string, Category[]>();
	for (const c of list) {
		if (!groups.has(c.group)) groups.set(c.group, []);
		groups.get(c.group)!.push(c);
	}
	return groups;
}

export const groups = group_categories(categories);

export const letters: Letter[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export type Response =
	| Letter // single: chosen option
	| Letter[] // multi: chosen options
	| (boolean | null)[] // truefalse
	| number[] // match: chosen choice per item, -1 if none
	| string[] // fill: entered values
	| { self: number; text: string }; // written: self-assessed score 0, 0.5 or 1

/** Chosen answer per category id, per question index */
export type Results = Record<string, Record<number, Response>>;

export function parse_number(text: string): number {
	const s = text.trim().replace(',', '.').replace('−', '-');
	if (s === '') return NaN;
	const fraction = s.match(/^(-?[\d.]+)\s*\/\s*(-?[\d.]+)$/);
	if (fraction) return Number(fraction[1]) / Number(fraction[2]);
	return Number(s);
}

export function blank_correct(q: FillQuestion, i: number, value: string) {
	return Math.abs(parse_number(value) - q.answer[i]) <= (q.tolerance ?? 1e-6);
}

function fraction_of<T>(given: T[], check: (value: T, i: number) => boolean) {
	return given.filter(check).length / given.length;
}

/** Fraction of the question answered correctly, between 0 and 1 */
export function score(q: Question, r: Response): number {
	switch (q.type) {
		case undefined:
		case 'single':
			return r === q.answer ? 1 : 0;
		case 'multi': {
			const chosen = new Set(r as Letter[]);
			return chosen.size === q.answer.length && q.answer.every((l) => chosen.has(l)) ? 1 : 0;
		}
		case 'truefalse':
			return fraction_of(r as (boolean | null)[], (v, i) => v === q.answer[i]);
		case 'match':
			return fraction_of(r as number[], (v, i) => v === q.answer[i]);
		case 'fill':
			return fraction_of(r as string[], (v, i) => blank_correct(q, i, v));
		case 'written':
			return (r as { self: number }).self;
	}
}

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
