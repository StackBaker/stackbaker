import { useEffect, useMemo, useState } from "react";
import { Stack } from "@mantine/core";
import FullCalendar from "@fullcalendar/react";
import interactionPlugin from "@fullcalendar/interaction";
import type { DropArg } from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import type { DateSelectArg, EventChangeArg, EventInput } from "@fullcalendar/core";
import type { DraggableLocation } from "@hello-pangea/dnd";
import { v4 as uuid } from "uuid";
import dayjs from "dayjs";

import type { EventList, EventRubric } from "./Event";
import "./fullcalendar-vars.css";
import { ID_IDX_DELIM } from "../Item";
import type { ItemCollection } from "../Item";
import type { ListCollection } from "../List";
import type { loadingStage } from "../coordinateBackendAndState";
import { dateToDayId, dayIdToDay } from "../dateutils";
import { useHotkeys } from "@mantine/hooks";
import { DO_LATER_LIST_ID, Id } from "../globals";

const EVENT_ID_PREFIX = "event-"
const createEventReprId = (id: Id): Id => `${EVENT_ID_PREFIX}${id}`;
const getIdFromEventRepr = (eventId: Id) => eventId.split(EVENT_ID_PREFIX)[1];

export interface overrideDragEndAttrs {
    sourceOfDrag: DraggableLocation,
    destinationOfDrag: DraggableLocation,
    draggableId: Id
};

interface GridCalendarProps {
    setDragOverride: React.Dispatch<React.SetStateAction<overrideDragEndAttrs | null>>,
    loadStage: loadingStage,
    readonly items: ItemCollection,
    lists: ListCollection,
    attemptCreateList: (date: dayjs.Dayjs | Date) => Promise<boolean>,
    mutateLists: (sourceOfDrag: DraggableLocation, destinationOfDrag: DraggableLocation, draggableId: Id, createNewLists?: boolean) => boolean,
};

const GridCalendar = function(props: GridCalendarProps) {
    const wrapperHeight = "85vh";
    const wrapperWidth = "45vw";
    const actualHeight = "150vh";

    const [events, setEvents] = useState<EventList>([]);


    useEffect(() => {
        // run once on render to initialize the events
        setEvents(
            Object.keys(props.lists).reduce((prev, cur) => {
                return prev.concat(props.lists[cur].itemIds.map((k) => ({
                    id: createEventReprId(props.items[k].itemId),
                    title: props.items[k].content,
                    start: dayIdToDay(cur).toDate(),
                    end: dayIdToDay(cur).add(1, "hour").toDate()
                })));
            }, [] as EventList)
        );
    }, [props.lists]);

    const handleAddItemThroughDrop = (info: DropArg) => {
        const el = info.draggedEl;
		const [id, sourceIndex] = el.id.split(ID_IDX_DELIM);
        const destIndex = 0;

        const item = props.items[id];

        const droppedDate = info.date; // 12am on dropped day
        const listId = dateToDayId(droppedDate);

        // ASSUMPTION: always from Later list
        props.setDragOverride({
            sourceOfDrag: {
                droppableId: DO_LATER_LIST_ID,
                index: parseInt(sourceIndex)
            },
            destinationOfDrag: {
                droppableId: listId,
                index: destIndex
            },
            draggableId: id
        });
        
        // const draggedEvent: EventRubric = {
        //     id: createEventReprId(id),
        //     title: item.content,
        //     start: droppedDate,
        //     end: dayjs(droppedDate).add(1, "hour").toDate()
        // }
    }

    const handleEventDrag = (changeInfo: EventChangeArg) => {
        const oldListId = dateToDayId(changeInfo.oldEvent.start!)
        
        console.log(changeInfo);
        // getIdFromEventRepr
    }


    // TODO: handle dragging events to another day

    return (
        <Stack className="grid-cal" h={wrapperHeight} w={wrapperWidth} sx={{ overflow: "hidden" }}>
            <Stack sx={{ overflow: "scroll" }}>
                <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
                    viewHeight={actualHeight}
                    height={actualHeight}
                    nowIndicator={true}
                    
                    editable={true}
                    events={events.map(x => x as EventInput)}
                    eventChange={handleEventDrag}

                    selectable={false}

                    droppable={true}
                    drop={handleAddItemThroughDrop}

                    headerToolbar={{
                        left: "prev",
                        center: "title",
                        right: "next"
                    }}

                    initialView="dayGridMonth"
                    displayEventTime={false}
                    dayMaxEventRows={true}
                />
            </Stack>
        </Stack>
    );
}

export default GridCalendar;
