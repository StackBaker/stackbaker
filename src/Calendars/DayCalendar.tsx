import { useMemo, useState } from "react";
import dayjs from "dayjs";
import FullCalendar from "@fullcalendar/react";
import type { EventChangeArg, EventClickArg, EventInput } from "@fullcalendar/core";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { createStyles, Stack, Title, Modal, Text, TextInput, Group, ActionIcon } from "@mantine/core";
import { useClickOutside, useDisclosure, useHotkeys } from "@mantine/hooks";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { v4 as uuid } from "uuid";

import { EventCollection, EventRubric } from "./Event";
import "./fullcalendar-vars.css";

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
		>
			<Group>
				<TextInput
					label="Title"
					value={props.eventBeingEdited?.title}
					onChange={handleChangeTitle}
				/>
			</Group>
			<Group position="apart">
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
	currentDay: dayjs.Dayjs
};

const DayCalendar = function(props: DayCalendarProps) {
	const { classes } = useStyles();
	const dayDuration = "30:00:00"; // 30 hour days

	// TODO: events should be a prop, retreived from backend through Dashboard
	// TODO: this looks like a lot of shit
	const dummy = uuid();
	const test = uuid();
	const [events, changeEvents] = useState<EventCollection>({
		[dummy]: {
			id: dummy,
			title: "Dummy event",
			start: dayjs().subtract(1, "hour").toDate(),
			end: Date()
		},
		[test]: {
			id: test,
			title: "test",
			start: dayjs().subtract(1, "hour").toDate(),
			end: Date()
		}
	});
	const omitDummy = (evts: EventCollection) => {
		const { [dummy]: omitted, ...rest } = evts;
		return rest;
	}
	const [editingEvent, handlers] = useDisclosure(false);
	const [eventBeingEdited, changeEventBeingEdited] = useState<EventRubric>(events[dummy]);

	const handleEventChange = (changeInfo: EventChangeArg) => {
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
		// open modal
		handlers.open();
		const id = clickInfo.event.id;
		changeEventBeingEdited(events[id]);
	}

	const saveEvent = () => {
		handlers.close();
		changeEvents({
			...events,
			[eventBeingEdited.id]: eventBeingEdited
		});
		changeEventBeingEdited(events[dummy]);
	}

	const deleteEvent = () => {
		handlers.close();
		var newEvents = structuredClone(events);
		delete events[eventBeingEdited.id];
		changeEventBeingEdited(events[dummy]);
		changeEvents(newEvents);
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
				editable={true}
				selectable={true}
				height={props.height}
				allDaySlot={false}
				nowIndicator={true}

				events={
					Object.keys(events).map(eid => events[eid] as EventInput)}
				eventChange={handleEventChange}
				eventClick={handleEventClick}

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