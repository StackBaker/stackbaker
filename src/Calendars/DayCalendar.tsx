import { useEffect, useState, useContext } from "react";
import dayjs from "dayjs";
import dayjsUTCPlugin from "dayjs/plugin/utc"
import FullCalendar from "@fullcalendar/react";
import type { DateSelectArg, EventChangeArg, EventClickArg, EventInput } from "@fullcalendar/core";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DropArg } from "@fullcalendar/interaction";
import { createStyles, Stack, Button, Title, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { v4 as uuid } from "uuid";
import { useNavigate, useLocation } from "react-router-dom"
import { invoke } from "@tauri-apps/api";
import { fetch as tauriFetch } from "@tauri-apps/api/http";
import { dateToDayId, getToday, offsetDay } from "../dateutils";

import type { EventRubric, GCalData, GCalItem } from "./Event";
import { createEventReprId, createGCalEventReprId } from "./Event";
import { Id, myStructuredClone } from "../globals";
import "./fullcalendar-vars.css";
import { ID_IDX_DELIM } from "../Item";;
import { PLANNER_PATH } from "../paths";
import { CoordinationContext } from "../coordinateBackendAndState";
import EditEventModal from "./DayCalEditEventModal";

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

// TODO: refactor the logic of this entire file

const DayCalendar = function(props: DayCalendarProps) {
	const coordination = useContext(CoordinationContext);

	const height = "80vh";
	const width = "310px";
	const navigate = useNavigate();
	const { classes } = useStyles();
	const location = useLocation();

	const selectedDayId = dateToDayId(props.date);

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

	// // TODO: are these useStates necessary?
	// const [dayDuration, setDayDuration] = useState<number>(coordination.user.hoursInDay);
	// const [eventDuration, setEventDuration] = useState<number>(coordination.user.defaultEventLength);
	// const [slotLabelInterval, setSlotLabelInterval] = useState<number>(coordination.user.dayCalLabelInterval);
	// const [snapDuration, setSnapDuration] = useState<number>(coordination.user.dayCalSnapDuration);

	useEffect(() => {
		if (!coordination.user || !coordination.user.authData) {
			return;
		}

		const accessTokenExpiryDate = coordination.user.authData?.expiryDate;
		if (accessTokenExpiryDate === undefined) {
			console.log("undefined expiry");
			return;
		}

		const expiryDate = dayjs(accessTokenExpiryDate!);
		// using the refresh token, refresh the access token
		if (dayjs().isAfter(expiryDate)) {
			invoke("exchange_refresh_for_access_token", { refreshToken: coordination.user.authData!.refreshToken }).then(r => {
				let res = r as { expires_in: number, access_token: string };
                const accessToken = res.access_token;
                const expiryDate = dayjs().add(Math.max(res.expires_in - 10, 0), "seconds").format();

                coordination.editUser({ authData: {
					refreshToken: coordination.user.authData!.refreshToken,
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
			searchParams.append("timeMax", getToday().add(coordination.user.hoursInDay, "hours").subtract(1, "minute").utc().format());
			const fetchURL = `${primaryCalURL}?${searchParams.toString()}`;

			tauriFetch(fetchURL, {
				method: "GET",
				headers: {
					"Authorization": `Bearer ${coordination.user.authData?.accessToken}`
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
	}, [coordination.user]);

	// TODO: be able to edit events locally and have that sync to GCal
	// TODO: google calendar logo should be at the top right of the Day Calendar
	// TODO: and that should be the button to enable or disable it
	// TODO: maybe a dropdown with the logo (GCal / Outlook / None) as the items

	useEffect(() => {
		// hack for preventing that one long error when adding changing events
		// and changing eventBeingEdited in the same sequence of actions
		if (!newEventId) {
			return;
		}
		changeEventBeingEdited(coordination.events[newEventId]);
		setNewEventId("");
		handlers.open();
	}, [newEventId]);

	// useEffect(() => {
	// 	// this is to handle changes to the user in settings while the app is running
	// 	if (!coordination.user)
	// 		return;
		
	// 	setDayDuration(coordination.user.hoursInDay);
	// 	setEventDuration(coordination.user.defaultEventLength);
	// 	setSlotLabelInterval(coordination.user.dayCalLabelInterval);
	// 	setSnapDuration(coordination.user.dayCalSnapDuration);
	// }, [coordination.user]);

	useEffect(() => {
		if (!editingEvent) {
			changeEventBeingEdited(dummyEvent);
		}
	}, [editingEvent]);

	const handleEventDrag = (changeInfo: EventChangeArg) => {
		const id = changeInfo.event.id;
		const evt = coordination.events[id];
		// TODO: evt may be in gcalEvents now, not in coordination.events!!!
		const noRepeats = (!evt.daysOfWeek || evt.daysOfWeek?.length === 0);
		let oldStart = dayjs(coordination.events[id].start! as Date);
		let _newStart = (changeInfo.event.start) ? changeInfo.event.start : coordination.events[id].start!;
		let newStart = dayjs(_newStart as Date);
		let oldEnd = dayjs(coordination.events[id].end! as Date);
		let _newEnd = (changeInfo.event.end) ? changeInfo.event.end : coordination.events[id].end!;
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

		if (newStart.isSame(newEnd) || newStart.isAfter(newEnd)) {
			return;
		}

		coordination.saveEvent({
			...coordination.events[changeInfo.event.id],
			start: newStart.toDate(),
			end: newEnd.toDate()
		});
	};

	const handleEventClick = (clickInfo: EventClickArg) => {
		// open the edit modal
		const id = clickInfo.event.id;
		changeEventBeingEdited(coordination.events[id]);
		handlers.open();
	}

	const saveEditingEvent = () => {
		// don't save events with empty titles
		if (eventBeingEdited.title === "") {
			deleteEditingEvent();
			return;
		}

		coordination.saveEvent(myStructuredClone(eventBeingEdited));
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
		coordination.deleteEvent(eventBeingEdited.id);
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
		coordination.saveEvent(newEvent);
		setNewEventId(newEventId);
	}

	const handleAddEventThroughDrop = (dropInfo: DropArg) => {
		const el = dropInfo.draggedEl;
		const [id, _] = el.id.split(ID_IDX_DELIM);

		// NOTE: operating assumption: the div id of the item is exactly the itemId
		const item = coordination.lists[selectedDayId].items[id];

		// TODO: update the Event model to store associated item
		const draggedEvent: EventRubric = {
			id: uuid(),
			title: item.content,
			start: dropInfo.date,
			end: dayjs(dropInfo.date).add(coordination.user.defaultEventLength, "minutes").toDate()
		};

		coordination.saveEvent(draggedEvent);
	};

	// TODO: bug: can't have recurring events that end at 6am???
	return ( (!coordination.user) ? <div></div> :
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
				dayDuration={coordination.user.hoursInDay}
				snapDuration={coordination.user.dayCalSnapDuration}
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
						Object.keys(coordination.events).map(eid => {
							const evt = coordination.events[eid];
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

					snapDuration={coordination.user.dayCalSnapDuration * 60 * 1000}
					slotDuration={Math.max(coordination.user.dayCalLabelInterval / 4, 15) * 60 * 1000}
					slotLabelInterval={coordination.user.dayCalLabelInterval * 60 * 1000}
					slotMaxTime={coordination.user.hoursInDay * 60 * 60 * 1000}
				/>}
			</Stack>
		</Stack>
	);
}

export default DayCalendar;