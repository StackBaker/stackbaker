import { DragDropContext } from "@hello-pangea/dnd";
import type { DraggableLocation, DropResult } from "@hello-pangea/dnd";
import { Group } from "@mantine/core";
import dayjs from "dayjs";

import { dateToDayId } from "../dateutils";
import { planningStage } from "./plannerutils";
import { ItemRubric, ItemCollection } from "../Item";
import List from "../List";
import type { ListCollection } from "../List";
import type { EventRubric, EventCollection } from "../Calendars/Event";
import { DO_LATER_LIST_ID, Id } from "../globals";
import DayCalendar from "../Calendars/DayCalendar";
import GridCalendar from "../Calendars/GridCalendar";
import { loadingStage } from "../coordinateBackendAndState";

interface PlannerMainProps {
    date: dayjs.Dayjs,
    planningStage: planningStage,
    items: ItemCollection,
    lists: ListCollection,
    events: EventCollection,
    createItem: (newItemConfig: ItemRubric, listId: Id) => boolean,
    mutateItem: (itemId: Id, newConfig: Partial<ItemRubric>) => boolean,
    deleteItem: (itemId: Id, listId: Id, index: number) => boolean,
    mutateLists: (sourceOfDrag: DraggableLocation, destinationOfDrag: DraggableLocation, draggableId: Id) => boolean,
    saveEvent: (newEventConfig: EventRubric) => boolean,
    deleteEvent: (eventId: Id) => boolean
};

// TODO: buttons should be bigger
// TODO: calendar events are not stored persistently
// TODO: Change the StageOne message
// TODO: finish the grid calendar


const PlannerMain = function(props: PlannerMainProps) {
    const onDragEnd = function(result: DropResult) {
        const { source, destination, draggableId } = result;

        if (!destination || (source.droppableId === destination.droppableId &&
            source.index === destination.index)) {
            return;
        }

        props.mutateLists(source, destination, draggableId);
    }

    const StageZero = (
        <List
            items={props.items}
            createItem={props.createItem}
            mutateItem={props.mutateItem}
            deleteItem={props.deleteItem}
            {...props.lists[dateToDayId(props.date)]}
        />
    );

    const StageOne = (
        <>
            <DayCalendar
                height="80vh"
                width="310px"
                date={props.date}
                items={props.items}
                events={props.events}
                saveEvent={props.saveEvent}
                deleteEvent={props.deleteEvent}
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
        </>
    );

    const StageTwo = (
        <>
            <GridCalendar
            />
            <List
                items={props.items}
                createItem={props.createItem}
                mutateItem={props.mutateItem}
                deleteItem={props.deleteItem}
                {...props.lists[DO_LATER_LIST_ID]}
            />
        </>
    );

    const FinalStage = (
        <>
            <DayCalendar
                height="80vh"
                width="310px"
                date={props.date}
                items={props.items}
                events={props.events}
                saveEvent={props.saveEvent}
                deleteEvent={props.deleteEvent}
            />
            <List
                items={props.items}
                createItem={props.createItem}
                mutateItem={props.mutateItem}
                deleteItem={props.deleteItem}
                {...props.lists[dateToDayId(props.date)]}
            />
        </>
    );

    // TODO: fix this
    const stages = [StageZero, StageOne, StageTwo, FinalStage]

    return (
        <DragDropContext
            onDragEnd={onDragEnd}
        >
            <Group
                position="left"
                spacing="lg"
                align="flex-start"
                p="xl"
            >
                {stages[props.planningStage]}
            </Group>
        </DragDropContext>
    );
}

export default PlannerMain;