import quizzes from './questions.json';
import lessons from './lessons.json';
import type { Category, LessonStep } from '$lib/mcq';

const lesson_by_id = lessons as Record<string, LessonStep[]>;

export const categories = (quizzes.categories as Category[]).map((c) => ({
	...c,
	lesson: lesson_by_id[c.id]
}));
