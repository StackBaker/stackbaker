import type { Id } from "../globals";
import type { DateInput } from "@fullcalendar/core";

const EVENT_ID_PREFIX = "event-"
export const createEventReprId = (id: Id): Id => `${EVENT_ID_PREFIX}${id}`;
export const getIdFromEventRepr = (eventId: Id) => eventId.split(EVENT_ID_PREFIX)[1];

export interface EventRubric {
    id: Id,
    title: string,
    start: DateInput | null,
    end: DateInput | null
};

export type EventCollection = { [key: Id]: EventRubric };

export type EventList = EventRubric[];
