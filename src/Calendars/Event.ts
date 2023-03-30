import type { Id } from "../globals";

export interface EventRubric {
    eventId: Id,
    title: string,
    start: Date,
    end: Date
};

export type EventCollection = { [key: Id]: EventRubric };