import { useMemo, useState } from "react";
import dayjs from "dayjs";
import FullCalendar from "@fullcalendar/react";
import type { EventChangeArg, EventClickArg, EventContentArg, EventInput } from "@fullcalendar/core";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { createStyles, Stack, Title, Group, TextInput, Text, ActionIcon } from "@mantine/core";
import { useClickOutside, useHotkeys } from "@mantine/hooks";
import { v4 as uuid } from "uuid";

import DayCalEventDisplay from "./Event";
import type { DayCalendarEventCollection } from "./Event";
import "./fullcalendar-vars.css";

const useStyles = createStyles((theme) => ({
	calendarWrapper: {
		paddingLeft: "12px",
		overflow: "hidden",
	}
}));

interface DayCalendarProps {
	height: string | number,
	width: string | number
	currentDay: dayjs.Dayjs
};

const DayCalendar = function(props: DayCalendarProps) {
	const { classes } = useStyles();
	const dayDuration = "30:00:00"; // 30 hour days

	// TODO: events should be a prop, retreived from backend through Dashboard
	const dummyEvent = uuid();
	const [events, changeEvents] = useState<DayCalendarEventCollection>({
		[dummyEvent]: {
			id: dummyEvent,
			title: "Dummy event",
			start: dayjs().startOf("hour").toDate(),
			end: dayjs().add(1, "hour").startOf("hour").toDate(),
			editing: false,
			ref: null
		}
	});

	const handleEventChange = (changeInfo: EventChangeArg) => {
		const newStart = (changeInfo.event.start) ? changeInfo.event.start : events[changeInfo.event.id].start;
		const newEnd = (changeInfo.event.start) ? changeInfo.event.end : events[changeInfo.event.id].end;

		changeEvents({
			...events,
			[changeInfo.event.id]: {
				...events[changeInfo.event.id],
				start: newStart,
				end: newEnd,
				editing: false
			}
		})
	};

	const handleEventClick = (clickInfo: EventClickArg) => {
		const id = clickInfo.event.id;
		const event = events[id];
		// TODO: make a simpler function to toggle the editing part of this
		changeEvents({
			...events,
			[id]: {
				...events[id],
				editing: true
			}
		});
	}

	const log = () => {
        console.log("e", events);
    }

    useHotkeys([
        ['E', log]
    ])

	const handleDropIntoDayCal = () => {};

	// TODO: ability to delete events
	// TODO: ability to add events through selection
	// TODO: ability to drag and drop events into calendar
	return (
		<Stack
			className={classes.calendarWrapper}
			sx={{ width: props.width }}
			p="sm"
		>
			<Title size="h2" pl="xs">
				{props.currentDay.format("MMMM DD, YYYY")}
			</Title>
			<FullCalendar
				plugins={[
					timeGridPlugin,
					interactionPlugin
				]}
				viewHeight={props.height}
				editable={true}
				selectable={true}
				height={props.height}
				allDaySlot={false}
				nowIndicator={true}

				events={Object.keys(events).map(eid => events[eid] as EventInput)}
				eventChange={handleEventChange}
				eventClick={handleEventClick}
				eventContent={(info: EventContentArg) => DayCalEventDisplay({ info, events, changeEvents })}

				droppable={true}
				drop={handleDropIntoDayCal}

				headerToolbar={false}
				titleFormat={{
					year: "numeric",
					month: "short",
					day: "numeric"
				}}
				dayHeaderFormat={{
					day: "numeric",
					month: "short",
					year: "numeric",
					omitCommas: true
				}}

				scrollTime={dayjs().subtract(1, "hour").format("HH:00")}
				scrollTimeReset={false}

				initialView="timeGridDay"
				initialDate={props.currentDay.toDate()}

				snapDuration={5 * 60 * 1000}
				slotDuration={15 * 60 * 1000}
				slotLabelInterval={60 * 60 * 1000}
				slotMaxTime={dayDuration}
			/>
		</Stack>
	);
}

export default DayCalendar;