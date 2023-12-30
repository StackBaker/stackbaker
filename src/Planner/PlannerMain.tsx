import { useEffect, useState, useContext } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import type { DraggableLocation, DropResult } from "@hello-pangea/dnd";
import { Group } from "@mantine/core";
import dayjs from "dayjs";

import { dateToDayId } from "../dateutils";
import { ItemRubric, ItemCollection } from "../Item";
import List from "../List";
import type { ListCollection, ListRubric } from "../List";
import type { EventRubric, EventCollection } from "../Calendars/Event";
import { LoadingStage, PlanningStage, DO_LATER_LIST_ID, Id } from "../globals";
import DayCalendar from "../Calendars/DayCalendar";
import GridCalendar from "../Calendars/GridCalendar";
import type { overrideDragEndAttrs } from "../Calendars/GridCalendar";
import { UserRubric } from "../Persistence/useUserDB";
import { CoordinationContext } from "../coordinateBackendAndState";

interface PlannerMainProps {
    date: dayjs.Dayjs,
    planningStage: PlanningStage
};

const PlannerMain = function(props: PlannerMainProps) {
    const coordination = useContext(CoordinationContext);

    // hack idea: manage the drop source and destination in parent state here
    const [override, setDragOverride] = useState<overrideDragEndAttrs | null>(null);

    const onDragEnd = function(result: DropResult) {
        if (override !== null) {
            coordination.dragBetweenLists(override.sourceOfDrag, override.destinationOfDrag, override.draggableId, true);
            setDragOverride(null);
            return;
        }

        const { source, destination, draggableId } = result;

        if (!destination || (source.droppableId === destination.droppableId &&
            source.index === destination.index)) {
            return;
        }

        coordination.dragBetweenLists(source, destination, draggableId);
    }

    const StageZero = (
        <List
            {...coordination.relevantListCollection[dateToDayId(props.date)]}
        />
    );

    const StageOne = (
        <>
            <DayCalendar
                date={props.date}
            />
            {Object.keys(coordination.relevantListCollection).map(tlid => {
                return (
                    <List
                        key={tlid}
                        {...coordination.relevantListCollection[tlid]}
                    />
                )})}
        </>
    );

    const StageTwo = (
        <>
            <GridCalendar
                setDragOverride={setDragOverride}
            />
            <List
                {...coordination.relevantListCollection[DO_LATER_LIST_ID]}
            />
        </>
    );

    const FinalStage = (
        <>
            <DayCalendar
                date={props.date}
            />
            <List
                {...coordination.relevantListCollection[dateToDayId(props.date)]}
            />
            <List
                {...coordination.relevantListCollection[DO_LATER_LIST_ID]}
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