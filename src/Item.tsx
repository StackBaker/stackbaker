import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { createStyles, Card, Text, Stack, Title, TextInput, Textarea } from "@mantine/core";

import type { Id } from "./globals";
import { useDisclosure, useClickOutside } from "@mantine/hooks";

const useStyles = createStyles((theme) => ({
    item: {
        maxWidth: "250px",
        minHeight: "84px",
        alignItems: "center",
        marginBottom: theme.spacing.sm,
    },
    itemText: {
        fontSize: "14px"
    },
    editingHint: {
        fontFamily: "JetBrains Mono",
        fontSize: "8px",
        marginLeft: "auto"
    }
}));

// TODO: finish the Task UI
// TODO: implement the add button to the List and keyboard shortcuts
export interface ItemRubric {
    itemId: Id,
    content: string,
    complete: boolean
};

interface ItemProps extends ItemRubric {
    index: number,
    mutateItem: (itemId: Id, newConfig: Partial<ItemRubric>) => boolean
};

const Item = function(props: ItemProps) {
    const { classes } = useStyles();
    const [editing, handlers] = useDisclosure(false);
    const itemRef = useClickOutside(() => handlers.close());
    
    const handleChangeContent = (newContent: string) => {
        props.mutateItem(props.itemId, { content: newContent });
    }

    return (
        <Draggable
            draggableId={props.itemId}
            index={props.index}
        >
            {
                (provided) => (
                    <Card
                        className={classes.item}
                        ref={provided.innerRef}
                        withBorder
                        {...provided.dragHandleProps}
                        {...provided.draggableProps}
                    >
                        <Stack ref={itemRef}>
                            {
                                (editing) ?
                                <Textarea
                                    className={classes.itemText}
                                    placeholder="New item..."
                                    aria-label={`item-${props.itemId}-input`}
                                    variant="unstyled"
                                    value={props.content}
                                    onChange={(e) => handleChangeContent(e.currentTarget.value)}
                                    onDoubleClick={(e) => handlers.open()}
                                    autosize
                                    size="sm"
                                /> :
                                <Text
                                    className={classes.itemText}
                                    onDoubleClick={(e) => handlers.open()}
                                    size="sm"
                                >
                                    {props.content}
                                </Text>
                            }
                        </Stack>
                        {/* pretty formatting, check mark for complete, text wrap */}
                    </Card>
                )
            }
        </Draggable>
    );
}

export default Item;
