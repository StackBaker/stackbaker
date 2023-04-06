import { useState } from "react";
import { Stack } from "@mantine/core";
import FullCalendar from "@fullcalendar/react";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import type { DateSelectArg, EventInput } from "@fullcalendar/core";
import { v4 as uuid } from "uuid";
import dayjs from "dayjs";

import type { EventList } from "./Event";
import "./fullcalendar-vars.css";

interface GridCalendarProps {

};

const GridCalendar = function(props: GridCalendarProps) {
    const wrapperHeight = "85vh";
    const wrapperWidth = "45vw";
    const actualHeight = "140vh";

    const [events, setEvents] = useState<EventList>([]);

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
			title: "Select",
			start: start.toDate(),
			end: end.toDate()
		};

        setEvents([...events, newEvent]);
	}

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

                    selectable={false}
                    select={handleAddTaskThroughSelection}

                    droppable={true}
                    drop={(i) => console.log('s', i)}

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
