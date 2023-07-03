import { FormEvent, useContext, useEffect, useState } from "react"; 
import type { Id } from "./globals"
import { Droppable } from "@hello-pangea/dnd";
import { Button, createStyles, Stack, TextInput, Title } from "@mantine/core";
import Item from "./Item";
import type { ItemRubric, ItemCollection } from "./Item";
import { useDisclosure, useHotkeys, useClickOutside } from "@mantine/hooks";
import { v4 as uuid } from "uuid";
import { useForm } from "@mantine/form";
import { DAY_LIST_TITLE, DO_LATER_LIST_ID, DO_LATER_LIST_TITLE, LIST_WIDTH, PriorityLevel } from "./globals";
import { CoordinationContext } from "./coordinateBackendAndState";

const useStyles = createStyles((theme) => ({
    listWrapper: {
        minHeight: "90vh",
        maxHeight: "90vh",
        overflow: "hidden!important"
    },
    list: {
        width: LIST_WIDTH,
        padding: theme.spacing.xs,
        overflow: "scroll!important",
        msOverflowStyle: "none",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": {
            display: "none"
        }
    }
}));

function getTitleFromId(listId: Id) {
    if (listId === DO_LATER_LIST_ID) {
        return DO_LATER_LIST_TITLE;
    } else {
        return DAY_LIST_TITLE;
    }
}
export interface ListRubric {
    listId: Id,
    planned: boolean,
    items: { [key: Id]: ItemRubric }
}

export type ListCollection = { [key: Id]: ListRubric };

interface ListProps extends ListRubric {
    collapseItems?: boolean
};

const List = function(props: ListProps) {
    const coordination = useContext(CoordinationContext);

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

        if (newItemContent === "")
            return;
            
        coordination.createItem({
            itemId: uuid(),
            content: newItemContent,
            complete: false,
            duration: coordination.user.defaultEventLength,
            priority: PriorityLevel.Medium,
            index: 0
        }, props.listId);
        changeNewItemContent("");
    }
    
    useEffect(() => {
        if (adding) {
            document.getElementById(newItemContentInputId)?.focus();
        }
    }, [adding]);

    if (props.listId === DO_LATER_LIST_ID) {
        useHotkeys([
            ["L", handlers.toggle]
        ]);
    } else {
        useHotkeys([
            ["N", handlers.toggle],
        ]);
    }

    return (
        <Stack
            justify="flex-start"
            className={classes.listWrapper}
            p="sm"
        >
            <Title order={2} pl="xs">{getTitleFromId(props.listId)}</Title>
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
                <Button onClick={() => handlers.open()} mr="xs">
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
                            {props.itemIds.map((tid) => (
                                <Item
                                    key={tid}
                                    listId={props.listId}
                                    collapseItem={props.collapseItems}
                                    {...coordination.items[tid] /* NOTE: this is currently coordination.items, should be props */} 
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
