export const FEEDBACK_TYPES = ['Bug', 'Feature Request', 'Other'] as const;
export type FeedbackType = typeof FEEDBACK_TYPES[number];
