import type { Id } from "../globals";
import type { DateInput } from "@fullcalendar/core";

const EVENT_ID_PREFIX = "event-";
const GCAL_EVT_ID_PREFIX = "gcalevent-";
export const createEventReprId = (id: Id): Id => `${EVENT_ID_PREFIX}${id}`;
export const createGCalEventReprId = (id: Id): Id => `${GCAL_EVT_ID_PREFIX}${id}`;
export const getIdFromEventRepr = (eventId: Id) => eventId.split(EVENT_ID_PREFIX)[1];

export interface EventRubric {
    id: Id,
    title: string,
    start: DateInput | null,
    end: DateInput | null,
    daysOfWeek?: number[] | null | undefined,
    endRecur?: DateInput | null | undefined
};

export type EventCollection = { [key: Id]: EventRubric };

export type EventList = EventRubric[];

export type GCalItem = {
    start: { dateTime: DateInput, timeZone: string }
    end: { dateTime: DateInput, timeZone: string },
    summary: string,
    id: Id
};

// TODO: make EventRubric more like GCalData
export type GCalData = {
    data: {
        items: GCalItem[]
    }
};
