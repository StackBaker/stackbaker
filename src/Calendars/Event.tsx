import type { Id } from "../globals";
import type { DateInput } from "@fullcalendar/core";

export interface EventRubric {
    id: Id,
    title: string,
    start: DateInput | null,
    end: DateInput | null
};

export type EventCollection = { [key: Id]: EventRubric };

export type EventList = EventRubric[];
