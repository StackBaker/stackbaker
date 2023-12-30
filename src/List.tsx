import { FormEvent, useContext, useEffect, useState } from "react"; 
import type { Id } from "./globals"
import { Droppable } from "@hello-pangea/dnd";
import { Button, createStyles, Stack, TextInput, Title } from "@mantine/core";
import Item from "./Item";
import type { ItemRubric, ItemCollection } from "./Item";
import { useDisclosure, useHotkeys, useClickOutside } from "@mantine/hooks";
import { v4 as uuid } from "uuid";
import { useForm } from "@mantine/form";
import { DO_LATER_LIST_ID, LIST_WIDTH, PriorityLevel, getTitleFromId } from "./globals";
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

const _itemOrder = function(a: ItemRubric, b: ItemRubric): number {
    if (a.index < b.index) {
        return -1;
    } else if (a.index > b.index) {
        return 1;
    } else {
        return 0;
    }
}

export interface ListRubric {
    // unique ID for this list: usually a formatted datestring
    listId: Id,
    // whether or not the user used the Planner for this day
    planned: boolean,
    // all the items for this list
    items: ItemCollection
}

export type ListCollection = { [key: Id]: ListRubric };

interface ListProps extends ListRubric {
    // whether to show items in collapsed view by default
    collapseItems?: boolean
};

const List = function(props: ListProps) {
    const coordination = useContext(CoordinationContext);

    const { classes } = useStyles();
    // adding a new item
    const [adding, handlers] = useDisclosure(false);
    // state variable to allow changing of new item content during addition
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
        
        // create the item
        coordination.createItem({
            itemId: uuid(),
            content: newItemContent,
            complete: false,
            duration: coordination.user.defaultEventLength,
            priority: PriorityLevel.Medium,
            index: 0
        }, props.listId);

        // reset the item addition state variable
        changeNewItemContent("");
    }
    
    // auto-focus on the Input element when adding new item
    useEffect(() => {
        if (adding) {
            document.getElementById(newItemContentInputId)?.focus();
        }
    }, [adding]);

    // keyboard shortcuts for adding a new item
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
                            {
                                // sort the output in order
                                Object.values(props.items).sort(_itemOrder).map((itm: ItemRubric) => (
                                    <Item
                                        key={itm.itemId}
                                        listId={props.listId}
                                        collapseItem={props.collapseItems}
                                        {...itm}
                                    />
                                ))
                            }
                            {provided.placeholder}
                        </Stack>
                    )
                }
            </Droppable>
        </Stack>
    );
}

export default List;
