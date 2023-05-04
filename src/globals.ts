import { cloneDeep } from "lodash";

export type Id = string;
export const DAY_LIST_ID: Id = "day-list";
export const DO_LATER_LIST_ID: Id = "later-list";
export const DAY_LIST_TITLE: string = "Items";
export const DO_LATER_LIST_TITLE: string = "Later"

export const myStructuredClone =
    (structuredClone === undefined) ? cloneDeep : structuredClone;
