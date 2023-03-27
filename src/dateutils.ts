import * as dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

const DATE_ID_FORMAT = "DD:MM:YYYY";

export function createDayId(date: Date | undefined) {
    return dayjs(date).format(DATE_ID_FORMAT);
}
