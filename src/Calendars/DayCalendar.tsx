import { useState } from "react";
import dayjs from "dayjs";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { createStyles } from "@mantine/core";

import type { EventCollection } from "./Event";
import "./fullcalendar-vars.css";

const useStyles = createStyles((theme) => ({
	calendarWrapper: {
		paddingLeft: "12px",
		overflow: "hidden",
	}
}));

// TODO: implement the calendar
interface DayCalendarProps {
	height: string | number,
	width: string | number
	currentDay: dayjs.Dayjs
};

const DayCalendar = function(props: DayCalendarProps) {
	const { classes } = useStyles();
	const dayDuration = "30:00:00"; // 30 hour days

	// TODO: events should be a prop, retreived from backend through Dashboard
	const [events, changeEvents] = useState<EventCollection>({});

	const handleEventChange = () => {};

	const handleDropIntoDayCal = () => {};

	// TODO: ability to delete events
	// TODO: ability to add events through selection
	return (
		<div
			className={classes.calendarWrapper}
			style={{
				height: props.height,
				width: props.width
			}}
		>
			<FullCalendar
				plugins={[
					timeGridPlugin,
					interactionPlugin
				]}
				editable={true}
				selectable={true}
				height={props.height}
				allDaySlot={false}
				nowIndicator={true}

				events={events}
				eventChange={handleEventChange}

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

				snapDuration={15 * 60 * 1000}
				slotDuration={30 * 60 * 1000}
				slotLabelInterval={60 * 60 * 1000}
				slotMaxTime={dayDuration}
			/>
		</div>
	);
}

export default DayCalendar;