import { useRef } from "react";
import dayjs from "dayjs";
import { createStyles, Stack, Button, Text, Modal, TextInput, Group, ActionIcon, Select, Grid, SelectItem, Avatar } from "@mantine/core";
import { getHotkeyHandler } from "@mantine/hooks";
import { DatePickerInput } from "@mantine/dates";
import type { DateValue } from "@mantine/dates";
import DeleteIcon from "@mui/icons-material/Delete";

import type { EventRubric } from "./Event";
import { myStructuredClone } from "../globals";
import "./fullcalendar-vars.css";
import { endOfOffsetDay, offsetDay } from "../dateutils";

const useStyles = createStyles((theme) => ({
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
	dayDuration: number,
	snapDuration: number,
};

const EditEventModal = function(props: EditEventModalProps) {
	const { classes } = useStyles();
	const inputRef = useRef<HTMLInputElement>(null);
	const timeDisplayFmt = "h:mm a";
	const dayBtnSize = 30;
	const quickDurationBtnSize = 75;
	const noRepeats = (!props.eventBeingEdited.daysOfWeek || props.eventBeingEdited.daysOfWeek?.length === 0);

	const handleChangeTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
		props.changeEventBeingEdited({
			...props.eventBeingEdited,
			title: e.currentTarget.value
		});
	}

	const handleChangeStartTime = (newStart: string | null) => {
		if (!newStart)
			return;

		let startDate = dayjs(newStart);
		const newStartDay = offsetDay(startDate);
		const newStartDayEnd = endOfOffsetDay(newStartDay);
		let endDate = dayjs(props.eventBeingEdited.end! as Date);

		if (!noRepeats) {
			// don't change the day of the start
			const originalStart = dayjs(props.eventBeingEdited.start! as Date);
			const originalStartDay = offsetDay(originalStart);
			// get the difference between the newStart and the beginning of its day
			const diff = startDate.diff(newStartDay);
			// then the new date is actually the original start + the new diff
			startDate = originalStartDay.add(diff);
		}

		if (endDate.isSame(startDate) || endDate.isBefore(startDate)) {
			endDate = startDate.add(endDate.diff(dayjs(props.eventBeingEdited.start! as Date)));
			if (endDate.isAfter(newStartDayEnd) || startDate.isSame(newStartDayEnd)) {
				startDate = newStartDayEnd;
			}
		}

		props.changeEventBeingEdited({
			...props.eventBeingEdited,
			start: startDate.toDate(),
			end: endDate.toDate()
		});
	}

	const handleChangeEndTime = (newEnd: string | null) => {
		if (!newEnd)
			return;
		
		let endDate = dayjs(newEnd);
		const newEndDay = offsetDay(endDate);
		let startDate = dayjs(props.eventBeingEdited.start! as Date);

		if (!noRepeats) {
			// don't change the day of the end
			const originalEnd = dayjs(props.eventBeingEdited.end! as Date);
			const originalEndDay = offsetDay(originalEnd);
			// get the difference between the newEnd and the beginning of its day
			const diff = endDate.diff(newEndDay);
			// then the new end date is actually the original end's day + the new diff
			endDate = originalEndDay.add(diff);
		}

		if (endDate.isSame(startDate) || endDate.isBefore(startDate)) {
			startDate = endDate.add(startDate.diff(dayjs(props.eventBeingEdited.end! as Date)));
			if (startDate.isBefore(newEndDay) || startDate.isSame(newEndDay)) {
				startDate = newEndDay;
			}
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

	const handleUseQuickButton = (durationMinutes: number) => {
		let startTime = dayjs(props.eventBeingEdited.start! as Date);
		let endTime = startTime.add(durationMinutes, "minutes");
		handleChangeEndTime(endTime.format());
	}

	// add 1 for padding
	const possibleTimes = Array(props.dayDuration * 12 + 1).fill(0).map((_, idx) => {
		const curTimeInMins = 5 * idx;
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
			title={<Text>Edit Event{ (!noRepeats) ? ", starts from " + offsetDay(dayjs(props.eventBeingEdited.start! as Date)).format("MMM D YYYY") : ""}</Text>}
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
						withinPortal
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
						withinPortal
						maxDropdownHeight={150}
					/>
				</Grid.Col>
				<Grid.Col span={12}>
					<Group position="apart" px="md">
						<Button variant="unstyled" p={0} m={0} onClick={() => { handleUseQuickButton(15); }}>
							<Avatar
								size={dayBtnSize}
								color="violet"
								w={quickDurationBtnSize}
								variant={
									(!props.eventBeingEdited.daysOfWeek || !props.eventBeingEdited.daysOfWeek?.includes(0)) ?
									"light" : "filled"
								}
							>
								15 min
							</Avatar>
						</Button>
						<Button variant="unstyled" p={0} m={0} onClick={() => { handleUseQuickButton(30); }}>
							<Avatar
								size={dayBtnSize}
								color="violet"
								w={quickDurationBtnSize}
								variant={
									(!props.eventBeingEdited.daysOfWeek || !props.eventBeingEdited.daysOfWeek?.includes(0)) ?
									"light" : "filled"
								}
							>
								30 min
							</Avatar>
						</Button>
						<Button variant="unstyled" p={0} m={0} onClick={() => { handleUseQuickButton(45); }}>
							<Avatar
								size={dayBtnSize}
								color="violet"
								w={quickDurationBtnSize}
								variant={
									(!props.eventBeingEdited.daysOfWeek || !props.eventBeingEdited.daysOfWeek?.includes(0)) ?
									"light" : "filled"
								}
							>
								45 min
							</Avatar>
						</Button>
						<Button variant="unstyled" p={0} m={0} onClick={() => { handleUseQuickButton(60); }}>
							<Avatar
								size={dayBtnSize}
								color="violet"
								w={quickDurationBtnSize}
								variant={
									(!props.eventBeingEdited.daysOfWeek || !props.eventBeingEdited.daysOfWeek?.includes(0)) ?
									"light" : "filled"
								}
							>
								1 hour
							</Avatar>
						</Button>
					</Group>
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
								// @ts-ignore DatePickerInput is an Input so it has a placeholder prop
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

export default EditEventModal;
