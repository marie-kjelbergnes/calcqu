/** A small single choice question inside a walkthrough, not scored */
export interface LessonCheck {
	question: string;
	options: string[];
	answer: string;
	explanation: string;
}

/**
 * One page of a walkthrough. Text fields may contain $latex$, **bold**,
 * blank lines between paragraphs and lines starting with "- " for bullet lists.
 */
export interface LessonStep {
	title: string;
	body: string;
	/** Worked example shown in a highlighted box */
	example?: string;
	image?: string;
	imageAlt?: string;
	/** Short summary of what to remember */
	remember?: string[];
	check?: LessonCheck;
}
