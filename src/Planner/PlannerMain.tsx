import { useEffect, useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import type { DraggableLocation, DropResult } from "@hello-pangea/dnd";
import { Group } from "@mantine/core";
import dayjs from "dayjs";

import { dateToDayId } from "../dateutils";
import { planningStage } from "./plannerutils";
import { ItemRubric, ItemCollection } from "../Item";
import List from "../List";
import type { ListCollection, ListRubric } from "../List";
import type { EventRubric, EventCollection } from "../Calendars/Event";
import { DO_LATER_LIST_ID, Id } from "../globals";
import DayCalendar from "../Calendars/DayCalendar";
import GridCalendar from "../Calendars/GridCalendar";
import type { overrideDragEndAttrs } from "../Calendars/GridCalendar";
import { LOADING_STAGES, loadingStage } from "../globals";
import { UserRubric } from "../Persistence/useUserDB";

interface PlannerMainProps {
    readonly user: UserRubric,
    editUser: (newUserConfig: Partial<UserRubric> | null) => boolean,
    date: dayjs.Dayjs,
    loadStage: loadingStage,
    planningStage: planningStage,
    items: ItemCollection,
    lists: ListCollection,
    relevantListCollection: ListCollection,
    events: EventCollection,
    createItem: (newItemConfig: ItemRubric, listId: Id) => boolean,
    mutateItem: (itemId: Id, newConfig: Partial<ItemRubric>) => boolean,
    toggleItemComplete: (itemId: Id, idx: number, listId: Id) => boolean,
    deleteItem: (itemId: Id, listId: Id, index: number) => boolean,
    mutateLists: (sourceOfDrag: DraggableLocation, destinationOfDrag: DraggableLocation, draggableId: Id, createNewLists?: boolean) => boolean,
    delManyItemsOrMutManyLists: (itemIds: Id[], newLists: ListRubric[]) => boolean,
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
            toggleItemComplete={props.toggleItemComplete}
            deleteItem={props.deleteItem}
            eventDuration={eventDuration}
            {...props.relevantListCollection[dateToDayId(props.date)]}
        />
    );

    // TODO: StageOne should be about reordering things, not putting things in the daycalendar
    const StageOne = (
        <>
            <DayCalendar
                date={props.date}
            />
            {Object.keys(props.relevantListCollection).map(tlid => {
                return (
                    <List
                        key={tlid}
                        {...props.relevantListCollection[tlid]}
                    />
                )})}
        </>
    );

    const StageTwo = (props.loadStage === LOADING_STAGES.READY) ? (
        <>
            <GridCalendar
                setDragOverride={setDragOverride}
            />
            <List
                {...props.relevantListCollection[DO_LATER_LIST_ID]}
            />
        </>
    ) : (
        <></>
    );

    // TODO: Final Stage should have the later list as well
    const FinalStage = (
        <>
            <DayCalendar
                date={props.date}
            />
            <List
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
                className="fade-in"
                position="left"
                spacing="lg"
                align="flex-start"
                p="xl"
                sx={{ flexWrap: "nowrap" }}
            >
                {stages[props.planningStage]}
            </Group>
        </DragDropContext>
    );
}

export default PlannerMain;