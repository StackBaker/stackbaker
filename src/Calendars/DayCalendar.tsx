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
import { loadingStage } from "../coordinateBackendAndState";

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
	saveEditingEvent: () => void,
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
			onClose={props.saveEditingEvent}
			title="Edit Event"
			centered
			onKeyDown={getHotkeyHandler([
				["Enter", () => {
					if (props.eventBeingEdited?.title.length === 0)
						inputRef.current?.focus();
					else
						props.saveEditingEvent();
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
	date: dayjs.Dayjs,
	readonly items: ItemCollection,
	loadStage: loadingStage,
	events: EventCollection,
	saveEvent: (newEventConfig: EventRubric) => boolean,
	deleteEvent: (eventId: Id) => boolean
};

// TODO: cleanup types with readonlys

const DayCalendar = function(props: DayCalendarProps) {
	const { classes, cx } = useStyles();
	const dayDuration = "30:00:00"; // 30 hour days: TODO: should be a config value

	const dummyEvent = {
		id: uuid(),
		title: "",
		start: dayjs().subtract(1, "hour").startOf("hour").toDate(),
		end: dayjs().startOf("hour").toDate(),
	};
	const [editingEvent, handlers] = useDisclosure(false);
	const [eventBeingEdited, changeEventBeingEdited] = useState<EventRubric>(dummyEvent);
	const [newEventId, setNewEventId] = useState<Id>("");
	// TODO: this will probably need loading stages in the coordinate backend and state

	useEffect(() => {
		// hack for preventing that one long error when adding changing events
		// and changing eventBeingEdited in the same sequence of actions
		if (!newEventId) {
			return;
		}
		handlers.open();
		changeEventBeingEdited(props.events[newEventId]);
		setNewEventId("");
	}, [newEventId]);

	const handleEventDrag = (changeInfo: EventChangeArg) => {
		const newStart = (changeInfo.event.start) ? changeInfo.event.start : props.events[changeInfo.event.id].start;
		const newEnd = (changeInfo.event.start) ? changeInfo.event.end : props.events[changeInfo.event.id].end;

		props.saveEvent({
			...props.events[changeInfo.event.id],
			start: newStart,
			end: newEnd
		});
	};

	const handleEventClick = (clickInfo: EventClickArg) => {
		// open the edit modal
		handlers.open();
		const id = clickInfo.event.id;
		changeEventBeingEdited(props.events[id]);
	}

	const saveEditingEvent = () => {
		// don't save events with empty titles
		if (eventBeingEdited.title === "") {
			return;
		}

		handlers.close();
		props.saveEvent(structuredClone(eventBeingEdited));
		changeEventBeingEdited(dummyEvent);
	}

	const deleteEvent = () => {
		handlers.close();
		props.deleteEvent(eventBeingEdited.id);
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
		const newEvent = {
			id: newEventId,
			title: "",
			start: start.toDate(),
			end: end.toDate()
		};
		props.saveEvent(newEvent);
		setNewEventId(newEventId);
	}

	const handleAddEventThroughDrop = (dropInfo: DropArg) => {
		const el = dropInfo.draggedEl;
		const id = el.id;

		// NOTE: operating assumption: the div id of the item is exactly the itemId
		const item = props.items[id];

		const draggedEvent: EventRubric = {
			id: uuid(),
			title: item.content,
			start: dropInfo.date,
			end: dayjs(dropInfo.date).add(1, "hour").toDate()
		};

		props.saveEvent(draggedEvent);
	};

	return (
		<Stack
			className={cx(classes.calendarWrapper, "day-cal")}
			sx={{ width: props.width }}
			p="sm"
		>
			<EditEventModal
				editingEvent={editingEvent}
				saveEditingEvent={saveEditingEvent}
				eventBeingEdited={eventBeingEdited}
				changeEventBeingEdited={changeEventBeingEdited}
				deleteEvent={deleteEvent}
			/>
			<Title size="h2" pl="xs">
				{props.date.format("MMMM D, YYYY")}
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
				events={Object.keys(props.events).map(eid => props.events[eid] as EventInput)}
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
				initialDate={props.date.toDate()}

				snapDuration={5 * 60 * 1000}
				slotDuration={15 * 60 * 1000}
				slotLabelInterval={60 * 60 * 1000}
				slotMaxTime={dayDuration}
			/>
		</Stack>
	);
}

export default DayCalendar;