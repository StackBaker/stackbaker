import type { Id } from "./globals"
import { Droppable, DragDropContext } from "@hello-pangea/dnd";
import type { DragDropContextProps, DropResult, DraggableLocation } from "@hello-pangea/dnd"
import { createStyles, Title } from "@mantine/core";

const useStyles = createStyles((theme) => {
    return ({

    });
});

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
            <Title size="h2">{props.title}</Title>
            <Droppable
                droppableId={props.taskListId}
            >
                {
                    (provided) => (
                        <div>

                            {provided.placeholder}
                        </div>
                    )
                }
            </Droppable>
        </DragDropContext>
    );
}

export default TaskList;
