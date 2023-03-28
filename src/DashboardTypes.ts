import type { TaskListRubric } from "./TaskList";
import type { TaskRubric } from "./Task";
import type { DraggableLocation } from "@hello-pangea/dnd";
import type { Id } from "./globals";

export type TaskListCollection = { [key: Id]: TaskListRubric };
export type TaskCollection = { [key: Id]: TaskRubric };

export interface LeftPanelProps {
    date: Date | null,
    setDate: React.Dispatch<React.SetStateAction<Date | null>>,
    opened: boolean
};

export interface TaskAreaProps {
    tasks: TaskCollection,
    taskLists: TaskListCollection,
    mutateTaskLists: (sourceOfDrag: DraggableLocation, destinationOfDrag: DraggableLocation, taskId: Id) => void
};

export interface DashboardProps {

};
