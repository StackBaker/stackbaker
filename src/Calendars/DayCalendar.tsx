import { useRef, useEffect, useState, useContext } from "react";
import dayjs from "dayjs";
import dayjsUTCPlugin from "dayjs/plugin/utc"
import FullCalendar from "@fullcalendar/react";
import type { DateSelectArg, EventChangeArg, EventClickArg, EventInput } from "@fullcalendar/core";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DropArg } from "@fullcalendar/interaction";
import { createStyles, Stack, Button, Title, Text, Modal, TextInput, Group, ActionIcon, Select, Grid, SelectItem, Avatar, Space } from "@mantine/core";
import { getHotkeyHandler, useDisclosure, useHotkeys } from "@mantine/hooks";
import { DatePickerInput } from "@mantine/dates";
import type { DateValue } from "@mantine/dates";
import DeleteIcon from "@mui/icons-material/Delete";
import { v4 as uuid } from "uuid";
import { useNavigate, useLocation } from "react-router-dom"
import { invoke } from "@tauri-apps/api";
import { fetch as tauriFetch } from "@tauri-apps/api/http";
import { getToday, offsetDay, endOfOffsetDay } from "../dateutils";

import type { EventRubric, GCalData, GCalItem } from "./Event";
import { createEventReprId, createGCalEventReprId } from "./Event";
import { Id, myStructuredClone } from "../globals";
import "./fullcalendar-vars.css";
import { ID_IDX_DELIM } from "../Item";;
import { PLANNER_PATH } from "../paths";
import { CoordinationContext } from "../coordinateBackendAndState";

dayjs.extend(dayjsUTCPlugin);

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

interface DayCalendarProps {
	date: dayjs.Dayjs
};

const DayCalendar = function(props: DayCalendarProps) {
	const coordination = useContext(CoordinationContext);

	const height = "80vh";
	const width = "310px";
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

	const [gcalEvents, setGcalEvents] = useState<EventInput[]>([]);
	const [editingEvent, handlers] = useDisclosure(false);
	const [eventBeingEdited, changeEventBeingEdited] = useState<EventRubric>(dummyEvent);
	const [newEventId, setNewEventId] = useState<Id>("");
	const [dayDuration, setDayDuration] = useState<number>(props.user.hoursInDay);
	const [eventDuration, setEventDuration] = useState<number>(props.user.defaultEventLength);
	const [slotLabelInterval, setSlotLabelInterval] = useState<number>(props.user.dayCalLabelInterval);
	const [snapDuration, setSnapDuration] = useState<number>(props.user.dayCalSnapDuration);

	useEffect(() => {
		if (!props.user || !props.user.authData)
			return;

		const accessTokenExpiryDate = props.user.authData?.expiryDate;
		if (accessTokenExpiryDate === undefined) {
			console.log("undefined expiry");
			return;
		}

		const expiryDate = dayjs(accessTokenExpiryDate!);
		// using the refresh token, refresh the access token
		if (dayjs().isAfter(expiryDate)) {
			invoke("exchange_refresh_for_access_token", { refreshToken: props.user.authData!.refreshToken }).then(r => {
				let res = r as { expires_in: number, access_token: string };
                const accessToken = res.access_token;
                const expiryDate = dayjs().add(Math.max(res.expires_in - 10, 0), "seconds").format();

                props.editUser({ authData: {
					refreshToken: props.user.authData!.refreshToken,
					accessToken,
					expiryDate
				}});
			});
		} else {
			// get the user's calendar events
			// THIS WORKS!
			const primaryCalURL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
			var searchParams = new URLSearchParams();
			// parameters should be in UTC time
			searchParams.append("timeMin", getToday().utc().format());
			searchParams.append("timeMax", getToday().add(dayDuration, "hours").subtract(1, "minute").utc().format());
			const fetchURL = `${primaryCalURL}?${searchParams.toString()}`;

			tauriFetch(fetchURL, {
				method: "GET",
				headers: {
					"Authorization": `Bearer ${props.user.authData?.accessToken}`
				}
			}).then(r => {
				let res = r as GCalData;
				let gcalOut = res.data.items.map((i: GCalItem) => {
					let ret: EventInput = {
						id: createGCalEventReprId(i.id),
						start: i.start.dateTime,
						end: i.end.dateTime,
						title: i.summary
					};
					return ret;
				});
				setGcalEvents(gcalOut);
				console.log("here", gcalOut);
			});
		}
	}, [props.user]);

	// TODO: be able to edit events locally and have that sync to GCal
	// TODO: google calendar logo should be at the top right of the Day Calendar
	// TODO: and that should be the button to enable or disable it

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
		setSnapDuration(props.user.dayCalSnapDuration);
	}, [props.user]);

	useEffect(() => {
		if (!editingEvent)
			changeEventBeingEdited(dummyEvent);

	}, [editingEvent]);

	const handleEventDrag = (changeInfo: EventChangeArg) => {
		const id = changeInfo.event.id;
		const evt = props.events[id];
		// TODO: evt may be in gcalEvents now, not in props.events!!!
		const noRepeats = (!evt.daysOfWeek || evt.daysOfWeek?.length === 0);
		let oldStart = dayjs(props.events[id].start! as Date);
		let _newStart = (changeInfo.event.start) ? changeInfo.event.start : props.events[id].start!;
		let newStart = dayjs(_newStart as Date);
		let oldEnd = dayjs(props.events[id].end! as Date);
		let _newEnd = (changeInfo.event.start) ? changeInfo.event.end : props.events[id].end!;
		let newEnd = dayjs(_newEnd as Date);
		
		// if the event is repeating, then we need different logic
		// than just changing the start and end dates
		const newStartDay = offsetDay(newStart);
		const newEndDay = offsetDay(newEnd);

		if (!noRepeats) {
			// don't change the day of the end
			const originalEndDay = offsetDay(oldEnd);
			// get the difference between the newEnd and the beginning of its day
			const ediff = newEnd.diff(newEndDay);
			// then the new end date is actually the original end's day + the new diff
			newEnd = originalEndDay.add(ediff);

			const originalStartDay = offsetDay(oldStart);
			// get the difference between the newStart and the beginning of its day
			const sdiff = newStart.diff(newStartDay);
			// then the new date is actually the original start + the new diff
			newStart = originalStartDay.add(sdiff);
		}

		if (newStart.isSame(newEnd) || newStart.isAfter(newEnd))
			return;

		props.saveEvent({
			...props.events[changeInfo.event.id],
			start: newStart.toDate(),
			end: newEnd.toDate()
		});
	};

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

	// TODO: bug: can't have recurring events that end at 6am???
	return ( (!props.user) ? <div></div> :
		<Stack
			className={classes.calendarWrapper}
			sx={{ width: width }}
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
				snapDuration={snapDuration}
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
					viewHeight={height}
					height={height}
					allDaySlot={false}
					nowIndicator={true}

					editable={true}
					events={
						Object.keys(props.events).map(eid => {
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
						}).concat(gcalEvents)
					}
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

					scrollTime={`${dayjs().subtract(1, "hour").diff(getToday(), "hours")}:00`}
					scrollTimeReset={false}

					initialView="timeGridDay"
					initialDate={props.date.toDate()}

					snapDuration={snapDuration * 60 * 1000}
					slotDuration={Math.max(slotLabelInterval / 4, 15) * 60 * 1000}
					slotLabelInterval={slotLabelInterval * 60 * 1000}
					slotMaxTime={dayDuration * 60 * 60 * 1000}
				/>}
			</Stack>
		</Stack>
	);
}

export default DayCalendar;