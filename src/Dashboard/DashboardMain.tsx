import { DragDropContext } from "@hello-pangea/dnd";
import { Group } from "@mantine/core";
import dayjs from "dayjs";
import type { DropResult, DraggableLocation } from "@hello-pangea/dnd";

import List from "../List";
import DayCalendar from "../Calendars/DayCalendar";
import type { ItemRubric, ItemCollection } from "../Item";
import type { ListCollection } from "../List";
import type { Id } from "../globals";

export interface DashboardMainProps {
    date: dayjs.Dayjs,
    items: ItemCollection,
    lists: ListCollection,
    createItem: (newItemConfig: ItemRubric, listId: Id) => boolean,
    mutateItem: (itemId: Id, newConfig: Partial<ItemRubric>) => boolean,
    deleteItem: (itemId: Id, listId: Id, index: number) => boolean,
    mutateLists: (sourceOfDrag: DraggableLocation, destinationOfDrag: DraggableLocation, taskId: Id) => boolean
};

const DashboardMain = function(props: DashboardMainProps) {
    const listWidth = "250px";

    const onDragEnd = function(result: DropResult) {
        const { source, destination, draggableId } = result;

        if (!destination || (source.droppableId === destination.droppableId &&
            source.index === destination.index)) {
            return;
        }

        props.mutateLists(source, destination, draggableId);
    }

    // TODO: implement undo with mod+Z
    // TODO: maybe header can display loading messages while retrieving stuff from backend
    // TODO: or retrieving stuff from GCal
    return (
        <DragDropContext
            onDragEnd={onDragEnd}
        >
            <Group
                position="left"
                spacing="lg"
                align="flex-start"
            >
                <DayCalendar
                    height="80vh"
                    width="310px"
                    currentDay={props.date.startOf("day")}
                    items={props.items}
                />
                {Object.keys(props.lists).map(tlid => {
                    return (
                        <List
                            key={tlid}
                            items={props.items}
                            createItem={props.createItem}
                            mutateItem={props.mutateItem}
                            deleteItem={props.deleteItem}
                            {...props.lists[tlid]}
                        />
                    )})}
            </Group>
        </DragDropContext>
    );
};

export default DashboardMain;
