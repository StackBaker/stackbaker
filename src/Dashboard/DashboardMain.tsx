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
import type { ListCollection, ListRubric } from "../List";
import type { Id } from "../globals";
import type { UserRubric } from "../Persistence/useUserDB";
import { EventRubric, EventCollection } from "../Calendars/Event";
import "../styles.css";
import { DEFAULT_OFFSET, endOfOffsetDay, getToday, offsetDay } from "../dateutils";
import { ROOT_PATH } from "../paths";
import GridCalendar from "../Calendars/GridCalendar";
import type { overrideDragEndAttrs } from "../Calendars/GridCalendar";
import type { loadingStage, DashboardViewOption } from "../globals";
import { DO_LATER_LIST_ID } from "../globals";

dayjs.extend(durationPlugin);

export interface DashboardMainProps {
    currentView: dashboardViewOption,
    loadStage: loadingStage,
    readonly user: UserRubric,
    date: dayjs.Dayjs,
    setDate: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>,
    items: ItemCollection,
    lists: ListCollection,
    relevantListCollection: ListCollection,
    events: EventCollection,
    editUser: (newUserConfig: Partial<UserRubric> | null) => boolean,
    createItem: (newItemConfig: ItemRubric, listId: Id) => boolean,
    mutateItem: (itemId: Id, newConfig: Partial<ItemRubric>) => boolean,
    toggleItemComplete: (itemId: Id, idx: number, listId: Id) => boolean,
    deleteItem: (itemId: Id, listId: Id, index: number) => boolean,
    mutateLists: (sourceOfDrag: DraggableLocation, destinationOfDrag: DraggableLocation, draggableId: Id, createNewLists?: boolean) => boolean,
    delManyItemsOrMutManyLists: (itemIds: Id[], newLists: ListRubric[]) => boolean,
    saveEvent: (newEventConfig: EventRubric) => boolean,
    deleteEvent: (eventId: Id) => boolean
};

const DashboardMain = function(props: DashboardMainProps) {
    const [override, setDragOverride] = useState<overrideDragEndAttrs | null>(null);
    const [eventDuration, setEventDuration] = useState<number>(props.user.defaultEventLength);
    const navigate = useNavigate();
    
    // attempt reload the page at 6am
    useEffect(() => {
        const resolution = 5 * 60 * 1000;
        const callback = () => {
            const today = getToday();
            const endOfToday = today.subtract(DEFAULT_OFFSET).add(-1, "minutes");

            const todayDiff = endOfToday.diff(endOfToday.startOf("day"));
            const _curDiff = dayjs();
            const curDiff = _curDiff.diff(_curDiff.startOf("day"));
            
            // TODO: test this
            if ((Math.abs(curDiff - todayDiff) <= resolution && !props.date.startOf("day").isSame(today)) ||
                (dayjs().isAfter(endOfOffsetDay(today)) && props.date.startOf("day").isSame(today))) {
                props.setDate(today);
                navigate(ROOT_PATH);
            }
        }

        if (typeof setInterval === 'undefined') {
            callback();
            return;
        }

        const ref = setInterval(callback, resolution);
        return () => clearInterval(ref);
    }, []);

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
                {
                    (props.currentView === "day") ?
                    <>
                        <DayCalendar
                            user={props.user}
                            editUser={props.editUser}
                            height="80vh"
                            width="310px"
                            date={props.date.startOf("day")}
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
                                    toggleItemComplete={props.toggleItemComplete}
                                    deleteItem={props.deleteItem}
                                    eventDuration={eventDuration}
                                    {...props.relevantListCollection[tlid]}
                                />
                            )
                        })}
                    </>
                    :
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
                            delManyItemsOrMutManyLists={props.delManyItemsOrMutManyLists}
                        />
                        <List
                            items={props.items}
                            toggleItemComplete={props.toggleItemComplete}
                            createItem={props.createItem}
                            mutateItem={props.mutateItem}
                            deleteItem={props.deleteItem}
                            eventDuration={eventDuration}
                            collapseItems={true}
                            {...props.relevantListCollection[DO_LATER_LIST_ID]}
                        />
                    </>
                }
            </Group>
        </DragDropContext>
    );
};

export default DashboardMain;
