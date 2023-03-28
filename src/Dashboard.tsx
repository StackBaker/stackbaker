import { useState } from "react";
import { createStyles, MantineTheme, Divider } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import type { DraggableLocation } from "@hello-pangea/dnd";

import DayCalendar from "./DayCalendar";
import TaskList from "./TaskList";
import type { TaskListRubric } from "./TaskList";
import Task from "./Task";
import type { TaskRubric } from "./Task";
import { DAY_TASK_LIST_ID, DO_LATER_TASK_LIST_ID, DAY_TASK_LIST_TITLE, DO_LATER_TASK_LIST_TITLE } from "./globals";
import type { Id } from "./globals";

const useStyles = createStyles((theme: MantineTheme) => {
    return ({
        wrapper: {
            display: "flex",
            flexDirection: "row",
            height: "97vh",
            width: "100%"
        },
        leftPanel: {
            display: "flex",
            flexDirection: "column",
            width: "20vw",
            padding: theme.spacing.sm
        },
        taskArea: {
            display: "flex",
            flexDirection: "row"
        }
    });
});

interface LeftPanelProps {
    date: Date | null,
    setDate: React.Dispatch<React.SetStateAction<Date | null>>
};

const LeftPanel = function(props: LeftPanelProps) {
    const { classes } = useStyles();

    return (
        <div className={classes.leftPanel}>
            <DatePicker
                value={props.date}
                onChange={props.setDate}
                size="xs"
            />
        </div>
    );
}

type TaskListCollection = { [key: Id]: TaskListRubric };
type TaskCollection = { [key: Id]: TaskRubric };

interface TaskAreaProps {
    taskLists: TaskListCollection,
    mutateTaskLists: (sourceOfDrag: DraggableLocation, destinationOfDrag: DraggableLocation, taskId: Id) => void,
}

const TaskArea = function(props: TaskAreaProps) {
    const { classes } = useStyles();

    return (
        <div className={classes.taskArea}>
            <DayCalendar />
            {Object.keys(props.taskLists).map(tlid => {
                return (
                    <TaskList
                        mutateTaskLists={props.mutateTaskLists}
                        {...props.taskLists[tlid]}
                    />
                )})}
        </div>
    );
}

interface DashboardProps {

};

const Dashboard = function(props: DashboardProps | undefined) {
    const { classes } = useStyles();
    const [date, setDate] = useState<Date | null>(new Date());
    
    // TODO: retrieve tasks for date from backend
    const [taskLists, setTaskLists] = useState<TaskListCollection>({
        [DAY_TASK_LIST_ID]: {
            taskListId: DAY_TASK_LIST_ID,
            title: DAY_TASK_LIST_TITLE,
            taskIds: []
        },
        [DO_LATER_TASK_LIST_ID]: {
            taskListId: DO_LATER_TASK_LIST_ID,
            title: DO_LATER_TASK_LIST_TITLE,
            taskIds: []
        }
    });

    const mutateTaskLists = (sourceOfDrag: DraggableLocation, destinationOfDrag: DraggableLocation, draggableId: Id) => {
        var sourceList = taskLists[sourceOfDrag.droppableId];
        var destList = taskLists[destinationOfDrag.droppableId];

        sourceList.taskIds.splice(sourceOfDrag.index, 1);
        destList.taskIds.splice(destinationOfDrag.index, 0, draggableId);

        setTaskLists({
            ...taskLists,
            [sourceOfDrag.droppableId]: sourceList,
            [destinationOfDrag.droppableId]: destList
        });
    }

    return (
        <div className={classes.wrapper}>
            <LeftPanel
                date={date}
                setDate={setDate}
            />
            <Divider
                size="xs"
                orientation="vertical"
                variant="solid"
            />
            <TaskArea 
                taskLists={taskLists}
                mutateTaskLists={mutateTaskLists}
            />
        </div>
    );
}

export default Dashboard;