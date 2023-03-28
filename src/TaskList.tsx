import type { Id } from "./globals"
import { Droppable, DragDropContext } from "@hello-pangea/dnd";
import type { DragDropContextProps, DropResult, DraggableLocation } from "@hello-pangea/dnd"
import { createStyles, Stack, Title } from "@mantine/core";

const useStyles = createStyles((theme) => ({
    taskList: {
        display: "flex",
        flexDirection: "column",
        width: "250px",
        height: "100px",
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
    dragDropContextProps?: Partial<DragDropContextProps>
};

const TaskList = function(props: TaskListProps) {
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
            {...props.dragDropContextProps}
        >
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
                            >
                                hi
                                {provided.placeholder}
                            </div>
                        )
                    }
                </Droppable>
            </Stack>
        </DragDropContext>
    );
}

export default TaskList;
