import { FormEvent, useEffect, useState } from "react"; 
import type { Id } from "./globals"
import { Droppable, DragDropContext } from "@hello-pangea/dnd";
import type { DraggableLocation } from "@hello-pangea/dnd"
import { Button, createStyles, Stack, TextInput, Title } from "@mantine/core";
import Item from "./Item";
import type { ItemRubric } from "./Item";
import { ItemCollection } from "./DashboardTypes";
import { useDisclosure, useHotkeys, useClickOutside } from "@mantine/hooks";
import { v4 as uuid } from "uuid";
import { useForm } from "@mantine/form";

import { DAY_LIST_ID, DO_LATER_LIST_ID } from "./globals";

const useStyles = createStyles((theme) => ({
    list: {
        display: "flex",
        flexDirection: "column",
        width: "250px", // TODO: make this some constant somewhere, perhaps in globals along with height
        padding: theme.spacing.xs
    },
    addButton: {
        // backgroundColor: theme.colors.stackblue[3]
    }
}));

export interface ListRubric {
    listId: Id,
    title: string,
    itemIds: Id[],
}

interface ListProps extends ListRubric {
    items: ItemCollection,
    createItem: (newItemConfig: ItemRubric, listId: Id) => boolean,
    mutateItem: (itemId: Id, newConfig: Partial<ItemRubric>) => boolean,
    deleteItem: (itemId: Id, listId: Id, index: number) => boolean,
    mutateLists: (sourceOfDrag: DraggableLocation, destinationOfDrag: DraggableLocation, taskId: Id) => boolean
};

const List = function(props: ListProps) {
    const { classes } = useStyles();
    const [adding, handlers] = useDisclosure(false);
    const [newItemContent, changeNewItemContent] = useState("");
    const newItemContentInputId = `${props.listId}-new-item-context-text-input`;
    const newItemContentInputRef = useClickOutside(handlers.close);

    const newItemForm = useForm({
        initialValues: {
            content: newItemContent
        },
        
        validate: {
            content: (val: string) => (val.length !== 0)
        }
    });

    const handleSubmitNewItem = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        handlers.close();

        if (newItemContent === "") {
            return;
        }
            
        props.createItem({
            itemId: uuid(),
            content: newItemContent,
            complete: false
        }, props.listId);
        changeNewItemContent("");
    }
    
    useEffect(() => {
        if (adding) {
            document.getElementById(newItemContentInputId)?.focus();
        }
    }, [adding]);

    if (props.listId === DAY_LIST_ID) {
        useHotkeys([
            ["N", handlers.toggle],
        ]);
    } else if (props.listId === DO_LATER_LIST_ID) {
        useHotkeys([
            ["K", handlers.toggle]
        ]);
    }

    return (
        <Stack justify="flex-start" sx={{ minHeight: "90vh", maxHeight: "90vh" }} p="sm">
            <Title size="h2" pl="xs">{props.title}</Title>
            {
                (adding) ?
                <form onSubmit={handleSubmitNewItem}>
                    <TextInput
                        id={newItemContentInputId}
                        ref={newItemContentInputRef}
                        aria-label={`${props.listId}-new-item-content-label`}
                        placeholder="New item..."
                        value={newItemContent}
                        onChange={(e) => {changeNewItemContent(e.currentTarget.value)}}
                        {...newItemForm.getInputProps}
                    />
                </form>

                : 
                <Button className={classes.addButton} onClick={() => handlers.open()} mr="xs">
                    Add Item
                </Button>
            }
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
                                    listId={props.listId}
                                    index={idx}
                                    mutateItem={props.mutateItem}
                                    deleteItem={props.deleteItem}
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
