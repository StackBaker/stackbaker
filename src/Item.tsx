import { useContext, useEffect, useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import type { DraggableStateSnapshot, DraggableStyle } from "@hello-pangea/dnd";
import { createStyles, Card, Text, ActionIcon, Textarea, Group } from "@mantine/core";
import { useDisclosure, useClickOutside, getHotkeyHandler } from "@mantine/hooks";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { ThirdPartyDraggable } from "@fullcalendar/interaction";

import { LIST_WIDTH } from "./globals";
import type { Id, PriorityLevel } from "./globals";
import { CoordinationContext } from "./coordinateBackendAndState";

export const ID_IDX_DELIM = "~";

const useStyles = createStyles((theme) => ({
    item: {
        maxWidth: LIST_WIDTH,
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
    },
    disabledInput: {
        color: theme.colors.gray[5]
    }
}));

export interface ItemRubric {
    itemId: Id,
    content: string,
    complete: boolean,
    duration: number,
    priority: PriorityLevel,
    index: number
};

export type ItemCollection = { [key: Id]: ItemRubric };

interface ItemProps extends ItemRubric {
    listId: Id,
    collapseItem?: boolean
};

const Item = function(props: ItemProps) {
    const coordination = useContext(CoordinationContext);

    const { classes } = useStyles();
    const [editing, handlers] = useDisclosure(false);
    const [editableContent, changeEditableContent] = useState<string>(props.content);
    const [collapse, collapseHandlers] = useDisclosure(true);
    const itemEltId = `${props.itemId}${ID_IDX_DELIM}${props.index}`;

    const handleToggleComplete = () => {
        handlers.close();
        coordination.toggleItemComplete(props.itemId, props.listId);
    }

    const handleSubmitContent = () => {
        if (editableContent.length === 0) {
            return;
        }

        handlers.close();
        coordination.mutateItem(props.itemId, { content: editableContent }, props.listId);
    }

    const editRef = useClickOutside(handleSubmitContent);
    const itemTextAreaId = `${props.itemId}-textarea-for-editing`;

    useEffect(() => {
        // reference: https://github.com/fullcalendar/fullcalendar-react/issues/118#issuecomment-761278598
        let draggable = new ThirdPartyDraggable(document.getElementById(itemEltId)!, {
            eventData: {
                title: props.content,
                duration: props.duration * 60 * 1000,
                create: false
            }
        });

        // a cleanup function
        return () => draggable.destroy();
    }, [props.content, props.duration]);

    useEffect(() => {
        if (editing) {
            const elt: HTMLTextAreaElement = document.getElementById(itemTextAreaId) as HTMLTextAreaElement;
            if (!elt)
                return;

            // when editing is set, focus on the TextArea
            elt.focus();
            // and set the cursor to the end of the input box
            elt.setSelectionRange(elt.value.length, elt.value.length);
        }
    }, [editing]);

    // TODO: tagging tasks
    const collapseDefined = (props.collapseItem !== undefined) && (props.collapseItem);

    const getStyle = (style: DraggableStyle, snapshot: DraggableStateSnapshot) => {
        if (!snapshot.isDropAnimating || !collapseDefined) {
            return style;
        }

        return { ...style, transitionDuration: "0.0001s" };
    }

    return (
        <Draggable
            draggableId={props.itemId}
            index={props.index}
        >
            {
                (provided, snapshot) => (
                    <Card
                        id={itemEltId}
                        className={classes.item}
                        mih={(collapseDefined && collapse) ? "54px" : "100px"}
                        ref={provided.innerRef}
                        withBorder
                        {...provided.dragHandleProps}
                        {...provided.draggableProps}
                        style={getStyle(provided.draggableProps.style!, snapshot)}
                        sx={{ flexShrink: 0 }}
                    >
                        <Card.Section
                            p={(collapseDefined && collapse) ? 0 : "xs"}
                            px={(collapseDefined && collapse) ? 0 : "md"}
                        >
                            {
                                (collapseDefined && collapse) ? 
                                <Group position="apart" p="xs" pl="md">
                                    <Text size="sm" maw="75%" truncate>{editableContent}</Text>
                                    <ActionIcon onClick={() => {collapseHandlers.close(); handlers.close()}}>
                                        <KeyboardArrowDownIcon />
                                    </ActionIcon>
                                </Group> :
                                (editing) ?
                                <Textarea
                                    id={itemTextAreaId}
                                    ref={editRef}
                                    placeholder="Item content..."
                                    aria-label={`item-${props.itemId}-input`}
                                    readOnly={!editing}
                                    disabled={props.complete}
                                    variant="unstyled"
                                    value={editableContent}
                                    onChange={(e) => changeEditableContent(e.currentTarget.value)}
                                    autosize
                                    onKeyDown={getHotkeyHandler([
                                        ["Enter", () => { if (editing) handleSubmitContent() }]
                                    ])}
                                    size="sm"
                                />
                                :
                                <Text
                                    className={(props.complete) ? classes.disabledInput : undefined}
                                    size="sm"
                                    onClick={() => {
                                        if (!props.complete) handlers.open()
                                    }}
                                    py="xs"
                                    pl={2}
                                >{editableContent}</Text>
                            }
                        </Card.Section>
                        <Card.Section>
                            {
                                (collapseDefined && collapse) ? <></> :
                                <Group pb="sm" pl="md" pr="xs" pt={0} position="apart">
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
                                            onClick={() => coordination.deleteItem(props.itemId, props.listId, props.index)}
                                        >
                                            <DeleteIcon />
                                        </ActionIcon>
                                    </Group>
                                    <Group position="right" spacing="xs">
                                        {
                                            (editing) ?
                                            <EditIcon className={classes.editSignal}/>
                                            : null
                                        }
                                        {
                                            (collapseDefined) ? 
                                            <ActionIcon onClick={collapseHandlers.open}>
                                                <KeyboardArrowUpIcon />
                                            </ActionIcon>
                                            : null
                                        }
                                    </Group>
                                    
                                </Group>
                            }
                        </Card.Section>
                    </Card>
                )
            }
        </Draggable>
    );
}

export default Item;
