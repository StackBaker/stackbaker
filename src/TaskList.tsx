import type { Id } from "./globals"
import { Droppable, DragDropContext } from "@hello-pangea/dnd";
import type { DraggableLocation } from "@hello-pangea/dnd"
import { createStyles, Stack, Title } from "@mantine/core";
import Task from "./Task";
import { TaskCollection } from "./DashboardTypes";

const useStyles = createStyles((theme) => ({
    taskList: {
        display: "flex",
        flexDirection: "column",
        width: "250px",
        padding: theme.spacing.xs
    }
}));

export interface TaskListRubric {
    taskListId: Id,
    title: string,
    taskIds: Id[],
}

interface TaskListProps extends TaskListRubric {
    mutateTaskLists: (sourceOfDrag: DraggableLocation, destinationOfDrag: DraggableLocation, taskId: Id) => void,
    tasks: TaskCollection
};

const TaskList = function(props: TaskListProps) {
    const { classes } = useStyles();

    return (
        <Stack sx={{ height: 100 }}>
            <Title size="h2">{props.title}</Title>
            <Droppable
                droppableId={props.taskListId}
            >
                {
                    (provided) => (
                        <div
                            ref={provided.innerRef}
                            className={classes.taskList}
                            {...provided.droppableProps}
                        >
                            {props.taskIds.map((tid, idx) => (
                                <Task 
                                    key={tid}
                                    index={idx}
                                    {...props.tasks[tid]}
                                />
                            ))}
                            {provided.placeholder}
                        </div>
                    )
                }
            </Droppable>
        </Stack>
    );
}

export default TaskList;
