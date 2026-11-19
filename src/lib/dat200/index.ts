import quizzes from './questions.json';
import exams from './exams.json';
import lessons from './lessons.json';
import type { Category, LessonStep } from '$lib/mcq';

const lesson_by_id = lessons as Record<string, LessonStep[]>;

/** DAT200 lecture quizzes followed by the exam question sets, with walkthroughs attached */
export const categories = ([...quizzes.categories, ...exams.categories] as Category[]).map((c) => ({
	...c,
	lesson: lesson_by_id[c.id]
}));
