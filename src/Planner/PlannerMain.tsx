import { useEffect, useState } from "react";
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
import type { overrideDragEndAttrs } from "../Calendars/GridCalendar";
import { loadingStage } from "../coordinateBackendAndState";
import { UserRubric } from "../Persistence/useUserDB";

interface PlannerMainProps {
    readonly user: UserRubric,
    date: dayjs.Dayjs,
    loadStage: loadingStage,
    planningStage: planningStage,
    items: ItemCollection,
    lists: ListCollection,
    relevantListCollection: ListCollection,
    events: EventCollection,
    createItem: (newItemConfig: ItemRubric, listId: Id) => boolean,
    mutateItem: (itemId: Id, newConfig: Partial<ItemRubric>) => boolean,
    deleteItem: (itemId: Id, listId: Id, index: number) => boolean,
    mutateLists: (sourceOfDrag: DraggableLocation, destinationOfDrag: DraggableLocation, draggableId: Id, createNewLists?: boolean) => boolean,
    saveEvent: (newEventConfig: EventRubric) => boolean,
    deleteEvent: (eventId: Id) => boolean
};

const PlannerMain = function(props: PlannerMainProps) {
    // hack idea: manage the drop source and destination in parent state here
    const [override, setDragOverride] = useState<overrideDragEndAttrs | null>(null);
    const [eventDuration, setEventDuration] = useState<number>(props.user.defaultEventLength);

    useEffect(() => {
        if (!props.user)
            return;
        setEventDuration(props.user.defaultEventLength);
    }, [props.user.defaultEventLength])
    
    const onDragEnd = function(result: DropResult) {
        if (override !== null) {
            props.mutateLists(override.sourceOfDrag, override.destinationOfDrag, override.draggableId, true);
            setDragOverride(null);
            return;
        }

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
            eventDuration={eventDuration}
            {...props.relevantListCollection[dateToDayId(props.date)]}
        />
    );

    const StageOne = (
        <>
            <DayCalendar
                user={props.user}
                height="80vh"
                width="310px"
                date={props.date}
                items={props.items}
                events={props.events}
                saveEvent={props.saveEvent}
                deleteEvent={props.deleteEvent}
            />
            {Object.keys(props.relevantListCollection).map(tlid => {
                return (
                    <List
                        key={tlid}
                        items={props.items}
                        createItem={props.createItem}
                        mutateItem={props.mutateItem}
                        deleteItem={props.deleteItem}
                        eventDuration={eventDuration}
                        {...props.relevantListCollection[tlid]}
                    />
                )})}
        </>
    );

    const StageTwo = (props.loadStage === 2) ? (
        <>
            <GridCalendar
                setDragOverride={setDragOverride}
                loadStage={props.loadStage}
                items={props.items}
                lists={props.lists}
                createItem={props.createItem}
                mutateItem={props.mutateItem}
                deleteItem={props.deleteItem}
                mutateLists={props.mutateLists}
            />
            <List
                items={props.items}
                createItem={props.createItem}
                mutateItem={props.mutateItem}
                deleteItem={props.deleteItem}
                eventDuration={eventDuration}
                collapseItems={props.planningStage === 2}
                {...props.relevantListCollection[DO_LATER_LIST_ID]}
            />
        </>
    ) : (
        <></>
    );

    const FinalStage = (
        <>
            <DayCalendar
                user={props.user}
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
                eventDuration={eventDuration}
                {...props.relevantListCollection[dateToDayId(props.date)]}
            />
        </>
    );

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
                sx={{ overflowX: "scroll", flexWrap: "nowrap" }}
            >
                {stages[props.planningStage]}
            </Group>
        </DragDropContext>
    );
}

export default PlannerMain;