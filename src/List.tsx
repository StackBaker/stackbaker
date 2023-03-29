import type { Id } from "./globals"
import { Droppable, DragDropContext } from "@hello-pangea/dnd";
import type { DraggableLocation } from "@hello-pangea/dnd"
import { createStyles, Stack, Title } from "@mantine/core";
import Item from "./Item";
import type { ItemRubric } from "./Item";
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
    items: ItemCollection,
    mutateItem: (itemId: Id, newConfig: Partial<ItemRubric>) => boolean,
    mutateLists: (sourceOfDrag: DraggableLocation, destinationOfDrag: DraggableLocation, taskId: Id) => boolean
};

const List = function(props: ListProps) {
    const { classes } = useStyles();

    return (
        <Stack justify="flex-start" sx={{ height: "100vh" }} p="sm">
            <Title size="h2">{props.title}</Title>
            <Droppable
                droppableId={props.listId}
                direction="vertical"
            >
                {
                    (provided) => (
                        <Stack
                            ref={provided.innerRef}
                            className={classes.list}
                            {...provided.droppableProps}
                            m={0}
                            justify="flex-start"
                            spacing={0}
                            pl={0}
                        >
                            {props.itemIds.map((tid, idx) => (
                                <Item 
                                    key={tid}
                                    index={idx}
                                    mutateItem={props.mutateItem}
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
