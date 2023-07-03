import { useState, useEffect, useContext } from "react";
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
import { DEFAULT_OFFSET, endOfOffsetDay, getToday } from "../dateutils";
import { ROOT_PATH } from "../paths";
import GridCalendar from "../Calendars/GridCalendar";
import type { overrideDragEndAttrs } from "../Calendars/GridCalendar";
import { LoadingStage, DashboardViewOption } from "../globals";
import { DO_LATER_LIST_ID } from "../globals";
import { CoordinationContext } from "../coordinateBackendAndState";

dayjs.extend(durationPlugin);

export interface DashboardMainProps {
    currentView: DashboardViewOption,
    date: dayjs.Dayjs,
    setDate: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>,
};

const DashboardMain = function(props: DashboardMainProps) {
    const coordination = useContext(CoordinationContext);

    const [override, setDragOverride] = useState<overrideDragEndAttrs | null>(null);
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

    const onDragEnd = function(result: DropResult) {
        if (override !== null) {
            coordination.mutateLists(override.sourceOfDrag, override.destinationOfDrag, override.draggableId, true);
            setDragOverride(null);
            return;
        }

        const { source, destination, draggableId } = result;

        if (!destination || (source.droppableId === destination.droppableId &&
            source.index === destination.index)) {
            return;
        }

        coordination.mutateLists(source, destination, draggableId);
    }

    return ((coordination.loadStage !== LoadingStage.Ready) ? <div></div> :
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
                    (props.currentView === DashboardViewOption.Day) ?
                    <>
                        <DayCalendar
                            date={props.date.startOf("day")}
                        />
                        {Object.keys(coordination.relevantListCollection).map(tlid => {
                            return (
                                <List
                                    key={tlid}
                                    {...coordination.relevantListCollection[tlid]}
                                />
                            )
                        })}
                    </>
                    :
                    <>
                        <GridCalendar
                            setDragOverride={setDragOverride}
                        />
                        <List
                            collapseItems={true}
                            {...coordination.relevantListCollection[DO_LATER_LIST_ID]}
                        />
                    </>
                }
            </Group>
        </DragDropContext>
    );
};

export default DashboardMain;
