import { useRef, useEffect, useState } from "react";
import dayjs from "dayjs";
import FullCalendar from "@fullcalendar/react";
import type { DateSelectArg, EventChangeArg, EventClickArg, EventInput } from "@fullcalendar/core";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DropArg } from "@fullcalendar/interaction";
import { createStyles, Stack, Title, Modal, TextInput, Group, ActionIcon } from "@mantine/core";
import { getHotkeyHandler, useDisclosure, useHotkeys } from "@mantine/hooks";
import DeleteIcon from "@mui/icons-material/Delete";
import { v4 as uuid } from "uuid";

import type { EventCollection, EventRubric } from "./Event";
import type { Id } from "../globals";
import "./fullcalendar-vars.css";
import { ItemCollection } from "../Item";

const useStyles = createStyles((theme) => ({
	calendarWrapper: {
		paddingLeft: "12px",
		overflow: "hidden",
	},
    editSignal: {
        color: theme.colors.stackblue[4]
    },
    del: {
        color: theme.colors.red[7]
    }
}));

interface EditEventModalProps {
	editingEvent: boolean,
	saveEvent: () => void,
	deleteEvent: () => void,
	eventBeingEdited: EventRubric,
	changeEventBeingEdited: React.Dispatch<React.SetStateAction<EventRubric>>
};

const EditEventModal = function(props: EditEventModalProps) {
	const { classes } = useStyles();
	const inputRef = useRef<HTMLInputElement>(null);

	const handleChangeTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
		props.changeEventBeingEdited({
			...props.eventBeingEdited,
			title: e.currentTarget.value
		});
	}

	return (
		<Modal
			opened={props.editingEvent}
			onClose={props.saveEvent}
			title="Edit Event"
			centered
			onKeyDown={getHotkeyHandler([
				["Enter", () => {
					if (props.eventBeingEdited?.title.length === 0)
						inputRef.current?.focus();
					else
						props.saveEvent();
				}]])}
		>
			<Group align="stretch" m="xs">
				<TextInput
					ref={inputRef}
					label="Title"
					value={props.eventBeingEdited?.title}
					onChange={handleChangeTitle}
				/>
			</Group>
			<Group position="right">
				<ActionIcon
					className={classes.del}
					onClick={props.deleteEvent}
				>
					<DeleteIcon />
				</ActionIcon>
			</Group>
		</Modal>
	);
}

interface DayCalendarProps {
	height: string | number,
	width: string | number
	currentDay: dayjs.Dayjs,
	readonly items: ItemCollection
};

// TODO: cleanup types with readonlys

const DayCalendar = function(props: DayCalendarProps) {
	const { classes } = useStyles();
	const dayDuration = "30:00:00"; // 30 hour days: TODO: should be a config value

	// TODO: events should be a prop, retreived from backend through Dashboard
	// TODO: this is a lot of shit
	const dummyEvent = {
		id: uuid(),
		title: "",
		start: dayjs().subtract(1, "hour").startOf("hour").toDate(),
		end: dayjs().startOf("hour").toDate(),
	};
	const [events, changeEvents] = useState<EventCollection>({});
	const [editingEvent, handlers] = useDisclosure(false);
	const [eventBeingEdited, changeEventBeingEdited] = useState<EventRubric>(dummyEvent);
	const [newEventId, setNewEventId] = useState<Id>("");

	useEffect(() => {
		// hack for preventing that one long error when adding changing events
		// and changing eventBeingEdited in the same sequence of actions
		if (!newEventId) {
			return;
		}
		handlers.open();
		changeEventBeingEdited(events[newEventId]);
		setNewEventId("");
	}, [newEventId]);

	const handleEventDrag = (changeInfo: EventChangeArg) => {
		const newStart = (changeInfo.event.start) ? changeInfo.event.start : events[changeInfo.event.id].start;
		const newEnd = (changeInfo.event.start) ? changeInfo.event.end : events[changeInfo.event.id].end;

		changeEvents({
			...events,
			[changeInfo.event.id]: {
				...events[changeInfo.event.id],
				start: newStart,
				end: newEnd
			}
		})
	};

	const handleEventClick = (clickInfo: EventClickArg) => {
		// open the edit modal
		handlers.open();
		const id = clickInfo.event.id;
		changeEventBeingEdited(events[id]);
	}

	const saveEvent = () => {
		// don't save events with empty titles
		if (eventBeingEdited.title === "") {
			return;
		}

		handlers.close();
		var newEvents = structuredClone(events);
		newEvents[eventBeingEdited.id] = structuredClone(eventBeingEdited);
		changeEvents(newEvents);
		changeEventBeingEdited(dummyEvent);
	}

	const deleteEvent = () => {
		handlers.close();
		var newEvents = structuredClone(events);
		delete newEvents[eventBeingEdited.id];
		changeEvents(newEvents);
		changeEventBeingEdited(dummyEvent);
	}

	const handleAddEventThroughSelection = (info: DateSelectArg) => {
		const start = dayjs(info.start);
		var end = dayjs(info.end);

		// make the minimum event size 15 minutes
		if (end.diff(start) < 15 * 60 * 1000) {
			end = start.add(15, "minute");
		}

		const newEventId = uuid();
		var newEvents = structuredClone(events);
		newEvents[newEventId]= {
			id: newEventId,
			title: "",
			start: start.toDate(),
			end: end.toDate()
		};
		changeEvents(newEvents);
		setNewEventId(newEventId);
	}

	const handleAddEventThroughDrop = (dropInfo: DropArg) => {
		const el = dropInfo.draggedEl;
		const id = el.id;

		// NOTE: operating assumption: the div id of the item is exactly the itemId
		const item = props.items[id];

		const draggedEventId = uuid();
		const draggedEvent: EventRubric = {
			id: draggedEventId,
			title: item.content,
			start: dropInfo.date,
			end: dayjs(dropInfo.date).add(1, "hour").toDate()
		};

		var newEvents = structuredClone(events);
		newEvents[draggedEventId] = draggedEvent;
		changeEvents(newEvents);
	};

	const log = () => {
        console.log("e", events);
    }

    useHotkeys([
        ['E', log]
    ])

	return (
		<Stack
			className={classes.calendarWrapper}
			sx={{ width: props.width }}
			p="sm"
		>
			<EditEventModal
				editingEvent={editingEvent}
				saveEvent={saveEvent}
				eventBeingEdited={eventBeingEdited}
				changeEventBeingEdited={changeEventBeingEdited}
				deleteEvent={deleteEvent}
			/>
			<Title size="h2" pl="xs">
				{props.currentDay.format("MMMM DD, YYYY")}
			</Title>
			<FullCalendar
				plugins={[
					timeGridPlugin,
					interactionPlugin
				]}
				viewHeight={props.height}
				height={props.height}
				allDaySlot={false}
				nowIndicator={true}

				editable={true}
				events={Object.keys(events).map(eid => events[eid] as EventInput)}
				eventChange={handleEventDrag}
				eventClick={handleEventClick}

				selectable={true}
				select={handleAddEventThroughSelection}

				droppable={true}
				drop={handleAddEventThroughDrop}

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