import { useState } from "react";
import { createStyles, AppShell, Navbar, Text, MediaQuery, Header, Burger, Group, Stack, Divider, Paper } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import type { DraggableLocation } from "@hello-pangea/dnd";

import DayCalendar from "./DayCalendar";
import TaskList from "./TaskList";
import type { TaskListRubric } from "./TaskList";
import Task from "./Task";
import type { TaskRubric } from "./Task";
import { DAY_TASK_LIST_ID, DO_LATER_TASK_LIST_ID, DAY_TASK_LIST_TITLE, DO_LATER_TASK_LIST_TITLE } from "./globals";
import type { Id } from "./globals";

const useStyles = createStyles((theme) => ({
    wrapper: {
        display: "flex",
        flexDirection: "row",
        height: "100%",
        width: "100%"
    },
    leftPanel: {

    },
    taskArea: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start"
    }
}));

interface LeftPanelProps {
    date: Date | null,
    setDate: React.Dispatch<React.SetStateAction<Date | null>>,
    opened: boolean
};

const LeftPanel = function(props: LeftPanelProps) {
    const { classes } = useStyles();

    return (
        <Navbar
            className={classes.leftPanel}
            p="md"
            hiddenBreakpoint="sm"
            hidden={!props.opened}
            width={{ sm: 250, lg: 250 }}
        >
            <Navbar.Section>
                <DatePicker
                    value={props.date}
                    onChange={props.setDate}
                    size="xs"
                />
            </Navbar.Section>
        </Navbar>
    );
}

// TODO: create a new DashBoardTypes.ts file
type TaskListCollection = { [key: Id]: TaskListRubric };
type TaskCollection = { [key: Id]: TaskRubric };

interface TaskAreaProps {
    taskLists: TaskListCollection,
    mutateTaskLists: (sourceOfDrag: DraggableLocation, destinationOfDrag: DraggableLocation, taskId: Id) => void,
}

const TaskArea = function(props: TaskAreaProps) {
    const { classes } = useStyles();

    return (
        <Group>
            <DayCalendar />
            {Object.keys(props.taskLists).map(tlid => {
                return (
                    <TaskList
                        key={tlid}
                        mutateTaskLists={props.mutateTaskLists}
                        {...props.taskLists[tlid]}
                    />
                )})}
        </Group>
    );
}

interface DashboardProps {

};

const Dashboard = function(props: DashboardProps | undefined) {
    const { classes } = useStyles();
    const [date, setDate] = useState<Date | null>(new Date());
    const [opened, setOpened] = useState(true);
    
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
        <Paper sx={{ height: "100px" }}>
            <AppShell
                navbarOffsetBreakpoint="sm"
                navbar={
                    <LeftPanel
                        date={date}
                        setDate={setDate}
                        opened={opened}
                    />
                }
                header={
                    <Header height={{ base: 50 /* , md: 70 */ }} p="md">
                        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                            <MediaQuery largerThan="sm" styles={{ display: 'none' }}>
                                <Burger
                                    opened={opened}
                                    onClick={() => setOpened((o) => !o)}
                                    size="sm"
                                    color="gray"
                                    mr="xl"
                                />
                            </MediaQuery>
                
                            <Text>Application header</Text>
                        </div>
                    </Header>
                }
            >
                <TaskArea 
                    taskLists={taskLists}
                    mutateTaskLists={mutateTaskLists}
                />
            </AppShell>
        </Paper>
    );

}


export default Dashboard;