import type { Dayjs } from "dayjs";
import type { DraggableLocation } from "@hello-pangea/dnd";

import type { ItemRubric, ItemCollection } from "./Item";
import type { ListCollection } from "./List";
import type { Id } from "./globals";

export interface LeftPanelProps {
    date: Dayjs,
    setDate: React.Dispatch<React.SetStateAction<Dayjs>>,
    opened: boolean
};

export interface ActionAreaProps {
    date: Dayjs,
    items: ItemCollection,
    lists: ListCollection,
    createItem: (newItemConfig: ItemRubric, listId: Id) => boolean,
    mutateItem: (itemId: Id, newConfig: Partial<ItemRubric>) => boolean,
    deleteItem: (itemId: Id, listId: Id, index: number) => boolean,
    mutateLists: (sourceOfDrag: DraggableLocation, destinationOfDrag: DraggableLocation, taskId: Id) => boolean
};

export interface DashboardProps {

};
