import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

export const DATE_ID_FORMAT = "DD__MM__YYYY";
export const DATE_ID_TZ_FORMAT = "DD__MM__YYYY__Z";

export type DayId = string;

export const dateToDayId = function(date: Date | dayjs.Dayjs | undefined): string {
    return dayjs(date).startOf("day").format(DATE_ID_FORMAT);
}

export const dayIdToDay = function(dayid: DayId): dayjs.Dayjs {
    return dayjs(dayid, DATE_ID_FORMAT).startOf("day");
}
