import * as dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

export const DATE_ID_FORMAT = "DD::MM::YYYY";

export const createDayId = function(date: Date | undefined) {
    return dayjs(date).format(DATE_ID_FORMAT);
}
