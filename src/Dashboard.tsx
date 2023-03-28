import { useState } from "react";
import { createStyles, AppShell, Navbar, Text, MediaQuery, Header, Burger, Group, Paper } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { v4 as uuid } from "uuid";
import { DragDropContext } from "@hello-pangea/dnd";
import type { DropResult, DraggableLocation } from "@hello-pangea/dnd"

import TaskList from "./TaskList";
import { DAY_TASK_LIST_ID, DO_LATER_TASK_LIST_ID, DAY_TASK_LIST_TITLE, DO_LATER_TASK_LIST_TITLE } from "./globals";

import type { Id } from "./globals";
import type { TaskCollection, TaskListCollection, LeftPanelProps, TaskAreaProps, DashboardProps } from "./DashboardTypes";

const useStyles = createStyles((theme) => ({
    wrapper: {},
    leftPanel: {},
    taskArea: {}
}));

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
            <Navbar.Section grow>{}</Navbar.Section>
            <Navbar.Section>TODO: local weather</Navbar.Section>
            <Navbar.Section>TODO: Account Settings</Navbar.Section>
        </Navbar>
    );
}

const TaskArea = function(props: TaskAreaProps) {
    const { classes } = useStyles();

    const onDragEnd = function(result: DropResult) {
        const { source, destination, draggableId } = result;

        if (!destination || (source.droppableId === destination.droppableId &&
            source.index === destination.index)) {
            return;
        }

        props.mutateTaskLists(source, destination, draggableId);
    }


    return (
        <DragDropContext
            onDragEnd={onDragEnd}
        >
            <Group className={classes.taskArea} position="left">
                {Object.keys(props.taskLists).map(tlid => {
                    return (
                        <TaskList
                            key={tlid}
                            mutateTaskLists={props.mutateTaskLists}
                            tasks={props.tasks}
                            {...props.taskLists[tlid]}
                        />
                    )})}
            </Group>
        </DragDropContext>
    );
}
const Dashboard = function(props: DashboardProps | undefined) {
    const { classes } = useStyles();
    const [date, setDate] = useState<Date | null>(new Date());
    const [opened, setOpened] = useState(false);
    
    // TODO: retrieve tasks for date from backend and remove this
    const dummyTaskId = uuid();
    const dummyTaskId2 = uuid();
    const [tasks, changeTasks] = useState<TaskCollection>({
        [dummyTaskId]: {
            taskId: dummyTaskId,
            content: "Get started with StackBaker!",
            complete: false
        },
        [dummyTaskId2]: {
            taskId: dummyTaskId2,
            content: "Bruh",
            complete: false
        }
    });

    const [taskLists, changeTaskLists] = useState<TaskListCollection>({
        [DAY_TASK_LIST_ID]: {
            taskListId: DAY_TASK_LIST_ID,
            title: DAY_TASK_LIST_TITLE,
            taskIds: [dummyTaskId]
        },
        [DO_LATER_TASK_LIST_ID]: {
            taskListId: DO_LATER_TASK_LIST_ID,
            title: DO_LATER_TASK_LIST_TITLE,
            taskIds: [dummyTaskId2]
        }
    });

    const mutateTaskLists = (sourceOfDrag: DraggableLocation, destinationOfDrag: DraggableLocation, draggableId: Id) => {
        var sourceList = taskLists[sourceOfDrag.droppableId];
        var destList = taskLists[destinationOfDrag.droppableId];

        sourceList.taskIds.splice(sourceOfDrag.index, 1);
        destList.taskIds.splice(destinationOfDrag.index, 0, draggableId);

        changeTaskLists({
            ...taskLists,
            [sourceOfDrag.droppableId]: sourceList,
            [destinationOfDrag.droppableId]: destList
        });
    }

    // have to do this sx thing because AppShell automatically renders too large
    return (
        <AppShell
            sx={{ main: { minHeight: "95vh", maxHeight: "95vh" }}}
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
                        <Text ff="JetBrains Mono">StackBaker</Text>
                    </div>
                </Header>
            }
        >
            <TaskArea
                tasks={tasks}
                taskLists={taskLists}
                mutateTaskLists={mutateTaskLists}
            />
        </AppShell>
    );
}

export default Dashboard;