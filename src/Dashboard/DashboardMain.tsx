import { useState, useEffect } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { Group } from "@mantine/core";
import dayjs from "dayjs";
import durationPlugin from "dayjs/plugin/duration";
import type { DropResult, DraggableLocation } from "@hello-pangea/dnd";
import { useNavigate } from "react-router-dom";

import List from "../List";
import DayCalendar from "../Calendars/DayCalendar";
import type { ItemRubric, ItemCollection } from "../Item";
import type { ListCollection } from "../List";
import type { Id } from "../globals";
import type { UserRubric } from "../Persistence/useUserDB";
import { EventRubric, EventCollection } from "../Calendars/Event";
import "../styles.css";
import { getToday, offsetDay } from "../dateutils";
import { ROOT_PATH } from "../paths";

dayjs.extend(durationPlugin);

export interface DashboardMainProps {
    readonly user: UserRubric,
    date: dayjs.Dayjs,
    items: ItemCollection,
    lists: ListCollection,
    events: EventCollection,
    createItem: (newItemConfig: ItemRubric, listId: Id) => boolean,
    mutateItem: (itemId: Id, newConfig: Partial<ItemRubric>) => boolean,
    deleteItem: (itemId: Id, listId: Id, index: number) => boolean,
    mutateLists: (sourceOfDrag: DraggableLocation, destinationOfDrag: DraggableLocation, draggableId: Id, createNewLists?: boolean) => boolean,
    saveEvent: (newEventConfig: EventRubric) => boolean,
    deleteEvent: (eventId: Id) => boolean
};

const DashboardMain = function(props: DashboardMainProps) {
    const listWidth = "250px";
    const [eventDuration, setEventDuration] = useState<number>(props.user.defaultEventLength);
    const navigate = useNavigate();
    
    // attempt reload the page at 6am
    useEffect(() => {
        const callback = () => {
            const today = getToday();
            const endOfToday = today.add(props.user.hoursInDay, "hours").add(-1, "minutes");
            if (dayjs().isAfter(endOfToday)) {
                navigate(ROOT_PATH);
            }
        }

        if (typeof setInterval === 'undefined') {
            callback();
            return;
        }

        const ref = setInterval(callback, 5 * 60 * 1000);
        return () => clearInterval(ref);
    }, []);

    useEffect(() => {
        if (!props.user)
            return;
        setEventDuration(props.user.defaultEventLength);
    }, [props.user.defaultEventLength])

    const onDragEnd = function(result: DropResult) {
        const { source, destination, draggableId } = result;

        if (!destination || (source.droppableId === destination.droppableId &&
            source.index === destination.index)) {
            return;
        }

        props.mutateLists(source, destination, draggableId);
    }

    return (
        <DragDropContext
            onDragEnd={onDragEnd}
        >
            <Group
                className="fade-in"
                position="left"
                spacing="lg"
                align="flex-start"
                sx={{ flexWrap: "nowrap" }}
            >
                <DayCalendar
                    user={props.user}
                    height="80vh"
                    width="310px"
                    date={props.date.startOf("day")}
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
                            eventDuration={eventDuration}
                            {...props.lists[tlid]}
                        />
                    )})}
            </Group>
        </DragDropContext>
    );
};

export default DashboardMain;
