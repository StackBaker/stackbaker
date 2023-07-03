import { cloneDeep } from "lodash";

export type Id = string;
export const DO_LATER_LIST_ID: Id = "later-list";
export const DAY_LIST_TITLE: string = "Items";
export const DO_LATER_LIST_TITLE: string = "Later";
export const LIST_WIDTH = "250px";

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

// TODO: comments
export enum PlanningStage {
    Dump,
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

// TODO: change this on push
export const isDev = function(): boolean {
    return true;
}
