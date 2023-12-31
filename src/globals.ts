import { cloneDeep } from "lodash";

export type Id = string;
export const DO_LATER_LIST_ID: Id = "later-list";
export const DAY_LIST_TITLE: string = "Items";
export const DO_LATER_LIST_TITLE: string = "Later";
export const LIST_WIDTH = "250px";

export function getTitleFromId(listId: Id) {
    if (listId === DO_LATER_LIST_ID) {
        return DO_LATER_LIST_TITLE;
    } else {
        return DAY_LIST_TITLE;
    }
}

export enum PriorityLevel {
    VeryLow,
    Low,
    Medium,
    High,
    Urgent
}

// solves bug on certain MacOS systems: structuredClone is not defined
export const myStructuredClone =
    (typeof structuredClone === "undefined") ? cloneDeep : structuredClone;


// different stages of setup for coordinateBackendAndState
export enum LoadingStage {
    NothingLoaded,
    DBLoaded,
    DBUpdated,
    Ready
}

export enum PlanningStage {
    Record,
    Estimate,
    PlanAhead,
    Timebox
}

export type PlanningStageStrings = { [key in PlanningStage]: string };

export enum DashboardViewOption {
    Day = "day",
    Month = "month",
    // TODO: week view
}

// IMPORTANT: toggle this on push
export const isDev = function(): boolean {
    return false;
}
