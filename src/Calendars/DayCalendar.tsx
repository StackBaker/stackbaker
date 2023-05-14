import { useRef, useEffect, useState } from "react";
import dayjs from "dayjs";
import FullCalendar from "@fullcalendar/react";
import type { DateSelectArg, EventAddArg, EventRemoveArg, EventChangeArg, EventClickArg, EventInput } from "@fullcalendar/core";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DropArg } from "@fullcalendar/interaction";
import { createStyles, Stack, Button, Title, Text, Modal, TextInput, Group, ActionIcon, Select, Grid, SelectItem, Avatar, Space } from "@mantine/core";
import { getHotkeyHandler, useDisclosure } from "@mantine/hooks";
import { DatePickerInput } from "@mantine/dates";
import type { DateValue } from "@mantine/dates";
import DeleteIcon from "@mui/icons-material/Delete";
import { v4 as uuid } from "uuid";
import { useNavigate, useLocation } from "react-router-dom"
import { os } from "@tauri-apps/api";
import { getToday, offsetDay } from "../dateutils";

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
	closeNoSave: () => void,
	eventBeingEdited: EventRubric,
	changeEventBeingEdited: React.Dispatch<React.SetStateAction<EventRubric>>,
	dayDuration: number
};

const EditEventModal = function(props: EditEventModalProps) {
	const { classes } = useStyles();
	const inputRef = useRef<HTMLInputElement>(null);
	const timeDisplayFmt = "h:mm a";
	// const dateDisplayFmt = "YYYYMMDDTHH:mmZ"
	const dayBtnSize = 30;
	const noRepeats = (!props.eventBeingEdited.daysOfWeek || props.eventBeingEdited.daysOfWeek?.length === 0);

	// TODO: test for bugs
	// TODO: bug: when adding an event through selection in the calendar, the modal
	// does not automatically pick up its starting and ending times
	console.log(props.eventBeingEdited);
	const handleChangeTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
		props.changeEventBeingEdited({
			...props.eventBeingEdited,
			title: e.currentTarget.value
		});
	}

	const handleChangeStartTime = (newStart: string | null) => {
		if (!newStart)
			return;
		
		// TODO: bug where changing the start time deletes all recurrences before the day when it was changed
		const startDate = dayjs(newStart);
		var endDate = dayjs(props.eventBeingEdited.end! as Date);
		if (endDate.isSame(startDate) || endDate.isBefore(startDate)) {
			endDate = startDate.add(endDate.diff(dayjs(props.eventBeingEdited.start! as Date)));
		}
		
		props.changeEventBeingEdited({
			...props.eventBeingEdited,
			start: startDate.toDate(),
			end: endDate.toDate()
		});
	}

	const handleChangeEndTime = (newEnd: string | null ) => {
		if (!newEnd)
			return;
		
		const endDate = dayjs(newEnd);
		var startDate = dayjs(props.eventBeingEdited.start! as Date);
		if (endDate.isSame(startDate) || endDate.isBefore(startDate)) {
			startDate = endDate.add(startDate.diff(dayjs(props.eventBeingEdited.end! as Date)));
		}
		
		props.changeEventBeingEdited({
			...props.eventBeingEdited,
			start: startDate.toDate(),
			end: endDate.toDate()
		});
	}

	const toggleIncludeDayOfWeek = (num: 0 | 1 | 2 | 3 | 4 | 5 | 6) => {
		// 0: Sun, 1: Mon, ..., 6: Sat - FC convention
		if (noRepeats) {
			props.changeEventBeingEdited({
				...props.eventBeingEdited,
				daysOfWeek: [num]
			});
			return;
		}

		let newDaysOfWeek = myStructuredClone(props.eventBeingEdited.daysOfWeek!);
		const idx = newDaysOfWeek.indexOf(num);
		if (idx === -1) {
			newDaysOfWeek.push(num);
		} else {
			newDaysOfWeek.splice(idx, 1);
		}
		
		props.changeEventBeingEdited({
			...props.eventBeingEdited,
			daysOfWeek: newDaysOfWeek
		})
	}

	const toggleDailyRepeat = () => {
		if (noRepeats) {
			props.changeEventBeingEdited({
				...props.eventBeingEdited,
				daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
			});
			return;
		}

		let newDaysOfWeek = myStructuredClone(props.eventBeingEdited.daysOfWeek!);
		if (newDaysOfWeek.sort().every((val, idx) => val === [0, 1, 2, 3, 4, 5, 6][idx])) {
			props.changeEventBeingEdited({
				...props.eventBeingEdited,
				daysOfWeek: []
			});
		} else  {
			props.changeEventBeingEdited({
				...props.eventBeingEdited,
				daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
			});
		}
	}

	const handlePickEndDate = (value: DateValue) => {
		// DateValue is Date | null
		if (value !== null) {
			const valAsDayjs: dayjs.Dayjs = dayjs(value).add(1, "day").startOf("day");
			const startDayjs = dayjs(props.eventBeingEdited.start! as Date);
			// don't end before you start
			if (valAsDayjs.isBefore(startDayjs) || valAsDayjs.isSame(startDayjs))
				return;
		}

		props.changeEventBeingEdited({
			...props.eventBeingEdited,
			endRecur: value
		})
	}

	const possibleTimes = Array(props.dayDuration * 4).fill(0).map((_, idx) => {
		const curTimeInMins = 15 * idx;
		const startDate = dayjs(props.eventBeingEdited.start! as Date);
		const startDay = offsetDay(startDate);
		const date = startDay.startOf("day").add(curTimeInMins, "minutes");
		const dayDiff = curTimeInMins / (24 * 60);
		let labelPrefix;
		if (noRepeats) {
			labelPrefix = date.format("ddd ");
		} else {
			labelPrefix = ((dayDiff >= 1) ? "Tomorrow " : "Today ");
		}

		return { value: date.format(), label: labelPrefix + date.format(timeDisplayFmt) } as SelectItem;
	});

	return (
		<Modal
			opened={props.editingEvent}
			onClose={props.closeNoSave}
			title={<Text>Edit Event, {dayjs(props.eventBeingEdited.start! as Date).format("MMM D YYYY")}</Text>}
			centered
			onKeyDown={getHotkeyHandler([
				["Enter", () => {
					if (props.eventBeingEdited?.title.length === 0)
						inputRef.current?.focus();
					else
						props.saveEditingEvent();
				}]])}
		>
			<Grid grow mb="xs">
				<Grid.Col span={12}>
					<TextInput
						ref={inputRef}
						label="Title"
						value={props.eventBeingEdited?.title}
						onChange={handleChangeTitle}
					/>
				</Grid.Col>
				<Grid.Col span={12}>
					<Select
						label="Start time"
						placeholder="Pick a start time"
						value={dayjs(props.eventBeingEdited.start! as Date).format()}
						onChange={handleChangeStartTime}
						data={possibleTimes}
						dropdownPosition="bottom"
						maxDropdownHeight={150}
					/>
				</Grid.Col>
				<Grid.Col span={12}>
					<Select
						label="End time"
						placeholder="Pick an end time"
						value={dayjs(props.eventBeingEdited.end! as Date).format()}
						onChange={handleChangeEndTime}
						data={possibleTimes}
						dropdownPosition="bottom"
						maxDropdownHeight={150}
					/>
				</Grid.Col>
				<Grid.Col span={2}>
					<Stack spacing={0}>
						<Text fz="sm" fw={450}>Repeats</Text>
						<Text
							c={
								(noRepeats) ?
								"dimmed" : "white"
							}
							fz="xs"
						>
							Never
						</Text>
					</Stack>
				</Grid.Col>
				<Grid.Col span={10}>
					<Group position="apart" align="center" spacing={2}>
						<Button variant="unstyled" p={0} m={0} onClick={() => toggleIncludeDayOfWeek(0)}>
							<Avatar
								size={dayBtnSize}
								color="blue"
								variant={
									(!props.eventBeingEdited.daysOfWeek || !props.eventBeingEdited.daysOfWeek?.includes(0)) ?
									"light" : "filled"
								}
							>
								S
							</Avatar>
						</Button>
						<Button variant="unstyled" p={0} m={0} onClick={() => toggleIncludeDayOfWeek(1)}>
							<Avatar
								size={dayBtnSize}
								color="blue"
								variant={
									(!props.eventBeingEdited.daysOfWeek || !props.eventBeingEdited.daysOfWeek?.includes(1)) ?
									"light" : "filled"
								}
							>
								M
							</Avatar>
						</Button>
						<Button variant="unstyled" p={0} m={0} onClick={() => toggleIncludeDayOfWeek(2)}>
							<Avatar
								size={dayBtnSize}
								color="blue"
								variant={
									(!props.eventBeingEdited.daysOfWeek || !props.eventBeingEdited.daysOfWeek?.includes(2)) ?
									"light" : "filled"
								}
							>
								T
							</Avatar>
						</Button>
						<Button variant="unstyled" p={0} m={0} onClick={() => toggleIncludeDayOfWeek(3)}>
							<Avatar
								size={dayBtnSize}
								color="blue"
								variant={
									(!props.eventBeingEdited.daysOfWeek || !props.eventBeingEdited.daysOfWeek?.includes(3)) ?
									"light" : "filled"
								}
							>
								W
							</Avatar>
						</Button>
						<Button variant="unstyled" p={0} m={0} onClick={() => toggleIncludeDayOfWeek(4)}>
							<Avatar
								size={dayBtnSize}
								color="blue"
								variant={
									(!props.eventBeingEdited.daysOfWeek || !props.eventBeingEdited.daysOfWeek?.includes(4)) ?
									"light" : "filled"
								}
							>
								T
							</Avatar>
						</Button>
						<Button variant="unstyled" p={0} m={0} onClick={() => toggleIncludeDayOfWeek(5)}>
							<Avatar
								size={dayBtnSize}
								color="blue"
								variant={
									(!props.eventBeingEdited.daysOfWeek || !props.eventBeingEdited.daysOfWeek?.includes(5)) ?
									"light" : "filled"
								}
							>
								F
							</Avatar>
						</Button>
						<Button variant="unstyled" p={0} m={0} onClick={() => toggleIncludeDayOfWeek(6)}>
							<Avatar
								size={dayBtnSize}
								color="blue"
								variant={
									(!props.eventBeingEdited.daysOfWeek || !props.eventBeingEdited.daysOfWeek?.includes(6)) ?
									"light" : "filled"
								}
							>
								S
							</Avatar>
						</Button>
						<Button variant="subtle" m={0} px="xs" size="xs" onClick={toggleDailyRepeat}>
							Daily
						</Button>
					</Group>
				</Grid.Col>
				{
					(!noRepeats) ? 
						<Grid.Col span={12}>
							<DatePickerInput
								label="Until"
								placeholder="By default, this event repeats indefinitely until deleted"
								allowDeselect
								firstDayOfWeek={0}
								popoverProps={{ zIndex: 201 }}
								defaultValue={
									(!props.eventBeingEdited.endRecur) ? undefined
									: dayjs(props.eventBeingEdited.endRecur! as Date).subtract(1, "day").toDate()
								}
								onChange={handlePickEndDate}
							/>
						</Grid.Col>
					: <></>
				}
			</Grid>
			<Group position="apart">
				<ActionIcon
					className={classes.del}
					onClick={props.deleteEditingEvent}
				>
					<DeleteIcon />
				</ActionIcon>
				<Button onClick={props.saveEditingEvent}>
					Save
				</Button>
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

	const dummyEvent: EventRubric = {
		id: createEventReprId("dummy" + uuid()),
		title: "dummy",
		start: dayjs().startOf("hour").add(1, "hour").toDate(),
		end: dayjs().startOf("hour").add(2, "hours").toDate(),
		daysOfWeek: null,
		endRecur: null
	};
	const [editingEvent, handlers] = useDisclosure(false);
	const [eventBeingEdited, changeEventBeingEdited] = useState<EventRubric>(dummyEvent);
	const [newEventId, setNewEventId] = useState<Id>("");
	const [dayDuration, setDayDuration] = useState<number>(props.user.hoursInDay);
	const [eventDuration, setEventDuration] = useState<number>(props.user.defaultEventLength);
	const [slotLabelInterval, setSlotLabelInterval] = useState<number>(props.user.dayCalLabelInterval);

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
		changeEventBeingEdited(props.events[newEventId]);
		setNewEventId("");
		handlers.open();
	}, [newEventId]);

	useEffect(() => {
		// this is to handle changes to the user in settings while the app is running
		if (!props.user)
			return;
		
		setDayDuration(props.user.hoursInDay);
		setEventDuration(props.user.defaultEventLength);
		setSlotLabelInterval(props.user.dayCalLabelInterval);
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
	}, [draggedCalEventInfo]);

	useEffect(() => {
		if (!editingEvent)
			changeEventBeingEdited(dummyEvent);

	}, [editingEvent])

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
			if (res !== "Darwin" && !dayjs(newStart! as Date).isSame(dayjs(props.events[changeInfo.event.id].start! as Date)))
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
		const id = clickInfo.event.id;
		changeEventBeingEdited(props.events[id]);
		handlers.open();
	}

	const saveEditingEvent = () => {
		// don't save events with empty titles
		if (eventBeingEdited.title === "") {
			deleteEditingEvent();
			return;
		}

		props.saveEvent(myStructuredClone(eventBeingEdited));
		handlers.close();
	}

	const closeNoSave = () => {
		if (eventBeingEdited.title === "") {
			deleteEditingEvent();
			return;
		}

		handlers.close();
	}

	const deleteEditingEvent = () => {
		handlers.close();
		props.deleteEvent(eventBeingEdited.id);
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
				closeNoSave={closeNoSave}
				deleteEditingEvent={deleteEditingEvent}
				dayDuration={dayDuration}
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
					events={Object.keys(props.events).map(eid => {
						const evt = props.events[eid];
						let output: EventInput
						if (evt.daysOfWeek === undefined || evt.daysOfWeek === null || evt.daysOfWeek.length === 0) {
							output = {
								id: evt.id,
								title: evt.title,
								start: evt.start!,
								end: evt.end!
							}
						} else {
							// enforcing that the start and end stored in EventRubric
							// can be converted to Date
							// i.e. that all EventRubric's should have their starts and ends
							// stored as Dates
							const startDate = dayjs(evt.start! as Date);
							const startDay = offsetDay(startDate);
							const startHours = startDate.diff(startDay, "hours");
							const startMinutes = startDate.format("mm");
							const endDate = dayjs(evt.end! as Date);
							const endDay = offsetDay(endDate);
							const endHours = endDate.diff(endDay, "hours")
							const endMinutes = endDate.format("mm");

							output = {
								id: evt.id,
								title: evt.title,
								startTime: `${startHours}:${startMinutes}`,
								endTime: `${endHours}:${endMinutes}`,
								daysOfWeek: evt.daysOfWeek,
								endRecur: evt.endRecur,
								startRecur: startDay.toDate()
							}
						}
						return output;
					})}
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

					scrollTime={`${dayjs().subtract(1, "hour").diff(getToday(), "hours")}:00`}
					scrollTimeReset={false}

					initialView="timeGridDay"
					initialDate={props.date.toDate()}

					snapDuration={15 * 60 * 1000}
					slotDuration={Math.max(slotLabelInterval / 4, 15) * 60 * 1000}
					slotLabelInterval={slotLabelInterval * 60 * 1000}
					slotMaxTime={dayDuration * 60 * 60 * 1000}
				/>}
			</Stack>
		</Stack>
	);
}

export default DayCalendar;