import type { Id } from "./globals"
import { Droppable, DragDropContext } from "@hello-pangea/dnd";
import type { DraggableLocation } from "@hello-pangea/dnd"
import { createStyles, Stack, Title } from "@mantine/core";
import Item from "./Item";
import { ItemCollection } from "./DashboardTypes";

const useStyles = createStyles((theme) => ({
    list: {
        display: "flex",
        flexDirection: "column",
        width: "250px",
        padding: theme.spacing.xs
    }
}));

export interface ListRubric {
    listId: Id,
    title: string,
    itemIds: Id[],
}

interface ListProps extends ListRubric {
    mutateTaskLists: (sourceOfDrag: DraggableLocation, destinationOfDrag: DraggableLocation, taskId: Id) => void,
    items: ItemCollection
};

const List = function(props: ListProps) {
    const { classes } = useStyles();

    return (
        <Stack justify="flex-start" sx={{ height: "100vh" }}>
            <Title size="h2">{props.title}</Title>
            <Droppable
                droppableId={props.listId}
            >
                {
                    (provided) => (
                        <Stack
                            ref={provided.innerRef}
                            className={classes.list}
                            {...provided.droppableProps}
                        >
                            {props.itemIds.map((tid, idx) => (
                                <Item 
                                    key={tid}
                                    index={idx}
                                    {...props.items[tid]}
                                />
                            ))}
                            {provided.placeholder}
                        </Stack>
                    )
                }
            </Droppable>
        </Stack>
    );
}

export default List;
