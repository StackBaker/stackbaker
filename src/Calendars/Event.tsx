import type { Id } from "../globals";
import type { DateInput, EventContentArg } from "@fullcalendar/core";
import { TextInput, Text, ActionIcon } from "@mantine/core";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import dayjs from "dayjs";

export interface EventRubric {
    id: Id,
    title: string,
    start: DateInput | null,
    end: DateInput | null
};

export type EventCollection = { [key: Id]: EventRubric };
