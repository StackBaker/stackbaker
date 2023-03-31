import type { Id } from "../globals";
import type { DateInput, EventContentArg } from "@fullcalendar/core";
import { TextInput, Text, ActionIcon } from "@mantine/core";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import dayjs from "dayjs";

export interface EventRubric {
    id: Id,
    title: string,
    start: DateInput | null,
    end: DateInput | null
};

export interface DayCalendarEventRubric extends EventRubric {
    editing: boolean,
    ref: React.MutableRefObject<HTMLDivElement> | null
};

export type EventCollection = { [key: Id]: EventRubric };
export type DayCalendarEventCollection = { [key: Id]: DayCalendarEventRubric };

interface DayCalEventDisplayProps {
    info: EventContentArg,
    events: DayCalendarEventCollection,
    changeEvents: React.Dispatch<React.SetStateAction<DayCalendarEventCollection>>
}

function DayCalEventDisplay(props: DayCalEventDisplayProps) {
    const id = props.info.event.id;
    const title = props.info.event.title;
    const start = dayjs(props.info.event.start);
    const end = dayjs(props.info.event.end);
    const timeFormat = "h:mm";
    const lessThan20Mins: boolean = (end.diff(start) < 30 * 60 * 1000);

    const customDisplay = (
        <div
            id={id}
            ref={props.events[id].ref}
            style={{
                display: "flex",
                flexDirection: (lessThan20Mins) ? "row" : "column"
            }}
        >
            <div
                id={`${id}-duration`}
                className=".fc fc-event-time fc-event-short"
            >
                {start.format(timeFormat)} - {end.format(timeFormat)}
            </div>
            <div
                id={`${id}-title-container`}
                className=".fc fc-event-title-container"
            >
                <div
                    id={`${id}-main`}
                    className=".fc fc-event-title"
                >
                    { (props.events[id].editing) ?
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "space-between" }}>
                            <TextInput
                                value={title}
                                variant="unstyled"
                                sx={{ color: "white", background: "transparent" }}
                                onChange={(e) => props.changeEvents({
                                    ...props.events,
                                    [id]: {
                                        ...props.events[id],
                                        title: e.currentTarget.value
                                    }
                                })}
                            />
                            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                                <ActionIcon size="xs" color="red">
                                    <DeleteIcon />
                                </ActionIcon>
                                <EditIcon />
                            </div>
                        </div>
                        :
                        <Text>{title}</Text>
                    }
                </div>

            </div>
        </div>
    );

    return customDisplay;
}

export default DayCalEventDisplay;
