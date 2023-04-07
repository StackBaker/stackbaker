import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import durationPlugin from "dayjs/plugin/duration";
dayjs.extend(customParseFormat);
dayjs.extend(durationPlugin);

export const DATE_ID_FORMAT = "DD__MM__YYYY";
export const DATE_ID_TZ_FORMAT = "DD__MM__YYYY__Z";

export const DEFAULT_OFFSET: ReturnType<typeof dayjs.duration> = dayjs.duration(-6, "hours");

export type DayId = string;

export const dateToDayId = function(date: Date | dayjs.Dayjs | undefined): string {
    return dayjs(date).startOf("day").format(DATE_ID_FORMAT);
}

export const dayIdToDay = function(dayid: DayId): dayjs.Dayjs {
    return dayjs(dayid, DATE_ID_FORMAT).startOf("day");
}

export const getToday = function(offset: ReturnType<typeof dayjs.duration> = DEFAULT_OFFSET) {
    return dayjs().add(offset).startOf("day");
}
