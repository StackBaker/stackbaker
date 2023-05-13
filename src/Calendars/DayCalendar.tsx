import { useRef, useEffect, useState } from "react";
import dayjs from "dayjs";
import FullCalendar from "@fullcalendar/react";
import type { DateSelectArg, EventAddArg, EventRemoveArg, EventChangeArg, EventClickArg, EventInput } from "@fullcalendar/core";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DropArg } from "@fullcalendar/interaction";
import { createStyles, Stack, Button, Title, Text, Modal, TextInput, Group, ActionIcon } from "@mantine/core";
import { getHotkeyHandler, useDisclosure } from "@mantine/hooks";
import DeleteIcon from "@mui/icons-material/Delete";
import { v4 as uuid } from "uuid";
import { useNavigate, useLocation } from "react-router-dom"
import { os } from "@tauri-apps/api";

import type { EventCollection, EventRubric } from "./Event";
import { createEventReprId } from "./Event";
import { Id, myStructuredClone } from "../globals";
import "./fullcalendar-vars.css";
import { ID_IDX_DELIM, ItemCollection } from "../Item";;
import { PLANNER_PATH } from "../paths";
import type { UserRubric } from "../Persistence/useUserDB";

const useStyles = createStyles((theme) => ({
	calendarWrapper: {
		paddingLeft: "12px",
		overflow: "hidden",
	},
	planButton: {
		opacity: 0.5,
		"&:hover": {
			opacity: 1,
		}
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
	deleteEditingEvent: () => void,
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
			title={<Text>Edit Event</Text>}
			centered
			onKeyDown={getHotkeyHandler([
				["Enter", () => {
					if (props.eventBeingEdited?.title.length === 0)
						inputRef.current?.focus();
					else
						props.saveEditingEvent();
				}]])}
		>
			<Group w="100%" m="xs">
				<TextInput
					ref={inputRef}
					label="Title"
					miw="90%"
					value={props.eventBeingEdited?.title}
					onChange={handleChangeTitle}
				/>
			</Group>
			<Group position="right">
				<ActionIcon
					className={classes.del}
					onClick={props.deleteEditingEvent}
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
	readonly user: UserRubric,
	readonly items: ItemCollection,
	events: EventCollection,
	saveEvent: (newEventConfig: EventRubric) => boolean,
	deleteEvent: (eventId: Id) => boolean,
};

const DayCalendar = function(props: DayCalendarProps) {
	const navigate = useNavigate();
	const { classes } = useStyles();
	const location = useLocation();

	const dummyEvent = {
		id: createEventReprId(uuid()),
		title: "",
		start: dayjs().subtract(1, "hour").startOf("hour").toDate(),
		end: dayjs().startOf("hour").toDate(),
	};
	const [editingEvent, handlers] = useDisclosure(false);
	const [eventBeingEdited, changeEventBeingEdited] = useState<EventRubric>(dummyEvent);
	const [newEventId, setNewEventId] = useState<Id>("");
	const [dayDuration, setDayDuration] = useState<number>(props.user.hoursInDay * 60 * 60 * 1000);
	const [eventDuration, setEventDuration] = useState<number>(props.user.defaultEventLength);

	// again a stupid hack to deal with fullcalendar
	const [draggedCalEventInfo, setDraggedCalEventInfo] =
		useState<{ newId: Id | null, newStart: Date | null, newEnd: Date | null }>({
			newId: null, newStart: null, newEnd: null
		});
	const [draggedCalEventOldId, setDraggedCalEventOldId] = useState<Id | null>(null);

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

	useEffect(() => {
		if (!props.user)
			return;
		
		setDayDuration(props.user.hoursInDay * 60 * 60 * 1000);
		setEventDuration(props.user.defaultEventLength);
	}, [props.user]);

	useEffect(() => {
		if (Object.values(draggedCalEventInfo).some(x => (!x)) || !draggedCalEventOldId)
			return;
		
		if (draggedCalEventOldId === draggedCalEventInfo.newId)
			props.saveEvent({
				...props.events[draggedCalEventInfo.newId!],
				start: draggedCalEventInfo.newStart!,
				end: draggedCalEventInfo.newEnd!
			});
		
		setDraggedCalEventInfo({ newId: null, newStart: null, newEnd: null });
		setDraggedCalEventOldId(null);
	}, [draggedCalEventInfo])

	const handleEventDrag = (changeInfo: EventChangeArg) => {
		// console.log("drag", changeInfo);
		const newStart = (changeInfo.event.start) ? changeInfo.event.start : props.events[changeInfo.event.id].start;
		const newEnd = (changeInfo.event.start) ? changeInfo.event.end : props.events[changeInfo.event.id].end;

		// TODO: test this thing on windows and macOS and in the release version
		os.type().then(res => {
			console.log(res);
			// hack for dealing with fullcalendar
			// FC fires eventChange, eventAdd, eventRemove and eventDrop when dragging events
			// this function should only handle dragging the ending of an event
			if (res === "Windows_NT" && !dayjs(newStart! as Date).isSame(dayjs(props.events[changeInfo.event.id].start! as Date)))
				return;

			props.saveEvent({
				...props.events[changeInfo.event.id],
				start: newStart,
				end: newEnd
			});
		});
	};

	const handleEventAdd = (addInfo: EventAddArg) => {
		setDraggedCalEventInfo({ newId: addInfo.event.id, newStart: addInfo.event.start!, newEnd: addInfo.event.end! });
	}

	const handleEventRemove = (removeInfo: EventRemoveArg) => {
		setDraggedCalEventOldId(removeInfo.event.id);
	}

	const handleEventClick = (clickInfo: EventClickArg) => {
		// open the edit modal
		handlers.open();
		const id = clickInfo.event.id;
		changeEventBeingEdited(props.events[id]);
	}

	const saveEditingEvent = () => {
		// don't save events with empty titles
		if (eventBeingEdited.title === "") {
			deleteEditingEvent();
			return;
		}

		handlers.close();
		props.saveEvent(myStructuredClone(eventBeingEdited));
		changeEventBeingEdited(dummyEvent);
	}

	const deleteEditingEvent = () => {
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

		const newEventId = createEventReprId(uuid());
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
		// console.log("drop", dropInfo);
		const el = dropInfo.draggedEl;
		const [id, _] = el.id.split(ID_IDX_DELIM);

		// NOTE: operating assumption: the div id of the item is exactly the itemId
		const item = props.items[id];
		if (!item)
			return;

		const draggedEvent: EventRubric = {
			id: uuid(),
			title: item.content,
			start: dropInfo.date,
			end: dayjs(dropInfo.date).add(eventDuration, "minutes").toDate()
		};

		props.saveEvent(draggedEvent);
	};

	return ( (!props.user) ? <div></div> :
		<Stack
			className={classes.calendarWrapper}
			sx={{ width: props.width }}
			p="sm"
		>
			<EditEventModal
				editingEvent={editingEvent}
				saveEditingEvent={saveEditingEvent}
				eventBeingEdited={eventBeingEdited}
				changeEventBeingEdited={changeEventBeingEdited}
				deleteEditingEvent={deleteEditingEvent}
			/>
			<Group position="apart">
				<Title order={2} pl="xs">
					{props.date.format("MMMM D, YYYY")}
				</Title>
				{
					(location.pathname === PLANNER_PATH) ? <></> :
					<Button
						className={classes.planButton}
						variant="subtle"
						onClick={() => {
							navigate(PLANNER_PATH);
						}}
					>
						Plan
					</Button>
				}
				
			</Group>
			<Stack className="day-cal">
				{(false) ? <div></div> :
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
					eventAdd={handleEventAdd}
					eventRemove={handleEventRemove}

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
				/>}
			</Stack>
		</Stack>
	);
}

export default DayCalendar;