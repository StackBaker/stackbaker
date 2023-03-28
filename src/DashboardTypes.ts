import type { ListRubric } from "./List";
import type { ItemRubric } from "./Item";
import type { DraggableLocation } from "@hello-pangea/dnd";
import type { Id } from "./globals";

export type ListCollection = { [key: Id]: ListRubric };
export type ItemCollection = { [key: Id]: ItemRubric };

export interface LeftPanelProps {
    date: Date | null,
    setDate: React.Dispatch<React.SetStateAction<Date | null>>,
    opened: boolean
};

export interface ActionAreaProps {
    items: ItemCollection,
    lists: ListCollection,
    mutateTaskLists: (sourceOfDrag: DraggableLocation, destinationOfDrag: DraggableLocation, taskId: Id) => void
};

export interface DashboardProps {

};
