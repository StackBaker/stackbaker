import { useState } from "react";
import { Stack } from "@mantine/core";
import FullCalendar from "@fullcalendar/react";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import type { DateSelectArg } from "@fullcalendar/core";
import { v4 as uuid } from "uuid";
import dayjs from "dayjs";

import "./fullcalendar-vars.css";

interface GridCalendarProps {

};

const GridCalendar = function(props: GridCalendarProps) {
    const height = "85vh";
    const width = "45vw";

    const [events, setEvents] = useState([
        {
            start: dayjs().toDate(),
            end: dayjs().add(2, "hours").toDate(),
            title: "hi",
            id: uuid()
        }
    ]);

	const handleAddTaskThroughSelection = (info: DateSelectArg) => {
		const start = dayjs(info.start);
		var end = dayjs(info.end);

		// make the minimum event size 15 minutes
		if (end.diff(start) < 15 * 60 * 1000) {
			end = start.add(15, "minute");
		}

		const newEventId = uuid();
		const newEvent= {
			id: newEventId,
			title: "Much larger than hi",
			start: start.toDate(),
			end: end.toDate()
		};

        setEvents([...events, newEvent]);
	}

    return (
        <Stack className="grid-cal" h={height} w={width}>
            <FullCalendar
                height={height}
                aspectRatio={9 / 16}
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: "prev",
                  center: "title",
                  right: "next"
                }}

                selectable={true}
                select={handleAddTaskThroughSelection}

                events={events}
                
                editable={true}

            />
        </Stack>
    );
}

export default GridCalendar;
