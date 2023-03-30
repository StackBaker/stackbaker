import { useState } from "react";
import dayjs from "dayjs";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import type { EventCollection } from "./Event";

import "./fullcalendar-vars.css";

// TODO: implement the calendar
interface DayCalendarProps {
	height: string | number,
	width: string | number
	currentDay: Date | dayjs.Dayjs
};

const DayCalendar = function(props: DayCalendarProps) {
	const [events, changeEvents] = useState<EventCollection>({});

	const handleEventChange = () => {};

	const handleDropIntoDayCal = () => {};

	// TODO: ability to delete events
	// TODO: ability to add events through selection
	return (
		<div
			style={{
				minHeight: props.height,
				maxHeight: props.height,
				minWidth: props.width,
				maxWidth: props.width,
				padding: "12px",
				marginTop: "-70px"
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

				headerToolbar={{
					start: "null",
					center: "null",
					end: "null"
				}}
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
			/>
		</div>
	);
}

export default DayCalendar;