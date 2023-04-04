import { useEffect, useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { createStyles, Card, Text, ActionIcon, Stack, Title, TextInput, Textarea, Paper, Group } from "@mantine/core";
import { useDisclosure, useClickOutside, getHotkeyHandler } from "@mantine/hooks";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { ThirdPartyDraggable } from "@fullcalendar/interaction";

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

export type ItemCollection = { [key: Id]: ItemRubric };

interface ItemProps extends ItemRubric {
    listId: Id,
    index: number,
    mutateItem: (itemId: Id, newConfig: Partial<ItemRubric>) => boolean,
    deleteItem: (itemId: Id, listId: Id, index: number) => boolean,
};

const Item = function(props: ItemProps) {
    const { classes } = useStyles();
    const [editing, handlers] = useDisclosure(false);
    const [editableContent, changeEditableContent] = useState<string>(props.content);

    const handleToggleComplete = () => {
        props.mutateItem(props.itemId, { complete: !props.complete });
    }

    const handleSubmitContent = () => {
        handlers.close();
        props.mutateItem(props.itemId, { content: editableContent });
    }

    // TODO: this is not working properly
    const editRef = useClickOutside(handleSubmitContent);

    useEffect(() => {
        // reference: https://github.com/fullcalendar/fullcalendar-react/issues/118#issuecomment-761278598
        // default task length is 1 hour: TODO: make this a config value
        let draggable = new ThirdPartyDraggable(editRef.current!, {
            eventData: {
                title: props.content!,
                duration: "1:00",
                create: false
            }
        });

        // a cleanup function
        return () => draggable.destroy();
    }, [props.content]);


    return (
        <Draggable
            draggableId={props.itemId}
            index={props.index}
        >
            {
                (provided) => (
                    <div ref={editRef} id={props.itemId}>
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
                                disabled={props.complete}
                                variant="unstyled"
                                value={editableContent}
                                onClick={() => handlers.open()}
                                onChange={(e) => changeEditableContent(e.currentTarget.value)}
                                autosize
                                onKeyDown={getHotkeyHandler([
                                    ["Enter", () => { if (editing) handleSubmitContent() }]
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
