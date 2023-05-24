import { cloneDeep } from "lodash";

export type Id = string;
export const DAY_LIST_ID: Id = "day-list";
export const DO_LATER_LIST_ID: Id = "later-list";
export const DAY_LIST_TITLE: string = "Items";
export const DO_LATER_LIST_TITLE: string = "Later"

export const myStructuredClone =
    (typeof structuredClone === "undefined") ? cloneDeep : structuredClone;

export type loadingStage = -1 | 0 | 1 | 2;
export const LOADING_STAGES: { [key: string]: loadingStage } = {
    NOTHING_LOADED: -1,
    DB_LOADED: 0,
    DB_UPDATED: 1,
    READY: 2
}

export type dashboardViewOption = "day" | "month"; // TODO: week view
