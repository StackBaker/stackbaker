import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { createStyles, Card, Text, ActionIcon, Stack, Title, TextInput, Textarea, Paper, Group } from "@mantine/core";
import { useDisclosure, useClickOutside, getHotkeyHandler } from "@mantine/hooks";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import type { Id } from "./globals";

const useStyles = createStyles((theme) => ({
    item: {
        maxWidth: "250px",
        minHeight: "84px",
        alignItems: "center",
        marginBottom: theme.spacing.sm,
    },
    editSignal: {
        color: theme.colors.stackblue[4]
    },
    check: {
        color: theme.colors.stackblue[2]
    },
    del: {
        color: theme.colors.red[7]
    }
}));

export interface ItemRubric {
    itemId: Id,
    content: string,
    complete: boolean
};

interface ItemProps extends ItemRubric {
    listId: Id,
    index: number,
    mutateItem: (itemId: Id, newConfig: Partial<ItemRubric>) => boolean,
    deleteItem: (itemId: Id, listId: Id, index: number) => boolean,
};

const Item = function(props: ItemProps) {
    const { classes } = useStyles();
    const [editing, handlers] = useDisclosure(false);
    const editRef = useClickOutside(() => handlers.close());
    
    const handleChangeContent = (newContent: string) => {
        props.mutateItem(props.itemId, { content: newContent });
    }

    const handleToggleComplete = () => {
        props.mutateItem(props.itemId, { complete: !props.complete });
    }

    return (
        <Draggable
            draggableId={props.itemId}
            index={props.index}
        >
            {
                (provided) => (
                    <div ref={editRef}>
                    <Card
                        className={classes.item}
                        ref={provided.innerRef}
                        withBorder
                        {...provided.dragHandleProps}
                        {...provided.draggableProps}
                    >
                        <Card.Section p="xs" pl="md" pr="md">
                            <Textarea
                                placeholder="Item content..."
                                aria-label={`item-${props.itemId}-input`}
                                readOnly={!editing}
                                variant="unstyled"
                                value={props.content}
                                onClick={() => handlers.open()}
                                onChange={(e) => handleChangeContent(e.currentTarget.value)}
                                autosize
                                onKeyDown={getHotkeyHandler([
                                    ["Enter", () => { if (editing) handlers.close() }]
                                ])}
                                size="sm"
                            />
                        </Card.Section>
                        <Card.Section>
                            <Group pb="sm" pl="md" pr="md" pt={0} position="apart">
                                <Group position="left" spacing="sm">
                                    <ActionIcon
                                        className={classes.check}
                                        onClick={handleToggleComplete}
                                    >
                                        {
                                            (props.complete) ?
                                            <CheckCircleIcon />
                                            : <CheckCircleOutlineIcon />
                                        }
                                    </ActionIcon>
                                    <ActionIcon
                                        className={classes.del}
                                        onClick={() => props.deleteItem(props.itemId, props.listId, props.index)}
                                    >
                                        <DeleteIcon />
                                    </ActionIcon>
                                </Group>
                                {
                                    (editing) ?
                                    <EditIcon className={classes.editSignal}/>
                                    : null
                                }
                            </Group>
                        </Card.Section>
                        {/* pretty formatting, check mark for complete, text wrap */}
                    </Card>
                    </div>
                )
            }
        </Draggable>
    );
}

export default Item;
