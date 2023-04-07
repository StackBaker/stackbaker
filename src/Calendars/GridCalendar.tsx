import dayjs from "dayjs";
import { v4 as uuid } from "uuid";
import { useEffect, useState, useRef } from "react";
import { createStyles, ActionIcon, TextInput, Text, Group, Modal, Stack } from "@mantine/core";
import { getHotkeyHandler, useDisclosure } from "@mantine/hooks";
import FullCalendar from "@fullcalendar/react";
import interactionPlugin from "@fullcalendar/interaction";
import type { DropArg } from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import type { DateSelectArg, EventChangeArg, EventClickArg, EventInput } from "@fullcalendar/core";
import type { DraggableLocation } from "@hello-pangea/dnd";
import DeleteIcon from "@mui/icons-material/Delete";

import type { EventList } from "./Event";
import "./fullcalendar-vars.css";
import { ID_IDX_DELIM } from "../Item";
import type { ItemCollection, ItemRubric } from "../Item";
import type { ListCollection } from "../List";
import type { loadingStage } from "../coordinateBackendAndState";
import { dateToDayId, dayIdToDay } from "../dateutils";
import { DO_LATER_LIST_ID, Id } from "../globals";

const EVENT_ID_PREFIX = "event-"
const createEventReprId = (id: Id): Id => `${EVENT_ID_PREFIX}${id}`;
const getIdFromEventRepr = (eventId: Id) => eventId.split(EVENT_ID_PREFIX)[1];

type ItemWithMutationInfo = ItemRubric & { listId: Id, index: number };

const useStyles = createStyles((theme) => ({
    del: {
        color: theme.colors.red[7]
    }
}));

interface EditItemModalProps {
    editingItem: boolean,
    saveEditingItem: () => void,
    deleteEditingItem: () => void,
    itemBeingEdited: ItemWithMutationInfo,
    changeItemBeingEdited: React.Dispatch<React.SetStateAction<ItemWithMutationInfo>>
};

const EditItemModal = function(props: EditItemModalProps) {
	const { classes } = useStyles();
	const inputRef = useRef<HTMLInputElement>(null);

	const handleChangeTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
		props.changeItemBeingEdited({
			...props.itemBeingEdited,
			content: e.currentTarget.value
		});
	}

	return (
		<Modal
			opened={props.editingItem}
			onClose={props.saveEditingItem}
			title={<Text>Edit Item</Text>}
			centered
			onKeyDown={getHotkeyHandler([
				["Enter", () => {
					if (props.itemBeingEdited?.content.length === 0)
						inputRef.current?.focus();
					else
						props.saveEditingItem();
				}]])}
		>
			<Group align="stretch" m="xs">
				<TextInput
					ref={inputRef}
					label="Content"
					value={props.itemBeingEdited?.content}
					onChange={handleChangeTitle}
				/>
			</Group>
			<Group position="right">
				<ActionIcon
					className={classes.del}
					onClick={props.deleteEditingItem}
				>
					<DeleteIcon />
				</ActionIcon>
			</Group>
		</Modal>
	);
}

export interface overrideDragEndAttrs {
    sourceOfDrag: DraggableLocation,
    destinationOfDrag: DraggableLocation,
    draggableId: Id
};

interface GridCalendarProps {
    setDragOverride: React.Dispatch<React.SetStateAction<overrideDragEndAttrs | null>>,
    loadStage: loadingStage,
    readonly items: ItemCollection,
    readonly lists: ListCollection,
    createItem: (newItemConfig: ItemRubric, listId: Id) => boolean,
    mutateItem: (itemId: Id, newConfig: Partial<ItemRubric>) => boolean,
    deleteItem: (itemId: Id, listId: Id, index: number) => boolean,
    mutateLists: (sourceOfDrag: DraggableLocation, destinationOfDrag: DraggableLocation, draggableId: Id, createNewLists?: boolean) => boolean,
};

const GridCalendar = function(props: GridCalendarProps) {
    const wrapperHeight = "85vh";
    const wrapperWidth = "45vw";
    const actualHeight = "150vh";
    const dummyItem: ItemWithMutationInfo = {
        itemId: uuid(),
        content: "",
        complete: false,
        listId: DO_LATER_LIST_ID,
        index: -1
    }

    const [events, setEvents] = useState<EventList>([]);
    const [editingItem, handlers] = useDisclosure(false);
    const [itemBeingEdited, changeItemBeingEdited] = useState<ItemWithMutationInfo>(dummyItem);

    useEffect(() => {
        // run once on render to initialize the events
        setEvents(
            Object.keys(props.lists).reduce((prev, cur) => {
                return prev.concat(props.lists[cur].itemIds.map((k) => ({
                    id: createEventReprId(props.items[k].itemId),
                    title: props.items[k].content,
                    start: dayIdToDay(cur).toDate(),
                    end: dayIdToDay(cur).add(1, "hour").toDate()
                })));
            }, [] as EventList)
        );
    }, [props.lists, props.items]);

    const handleEventClick = (clickInfo: EventClickArg) => {
        const id = getIdFromEventRepr(clickInfo.event.id);
        const dayId = dateToDayId(clickInfo.event.start!);
        const index = props.lists[dayId].itemIds.indexOf(id);
        const item: ItemWithMutationInfo = { ...props.items[id], listId: dayId, index: index };
        changeItemBeingEdited(item);
        handlers.open();
    }

    const saveEditingItem = () => {
        if (itemBeingEdited.content === "") {
            return;
        }

        handlers.close();
        const { listId, index, ...rest  } = itemBeingEdited;
        props.mutateItem(rest.itemId, rest);
        changeItemBeingEdited(dummyItem);
    }
    
    const deleteEditingItem = () => {
        handlers.close();
        const { listId, index, ...rest } = itemBeingEdited;
        props.deleteItem(rest.itemId, listId, index);
        changeItemBeingEdited(dummyItem);
    };

    const handleAddItemThroughDrop = (info: DropArg) => {
        const el = info.draggedEl;
		const [id, sourceIndex] = el.id.split(ID_IDX_DELIM);
        const destIndex = 0;

        const droppedDate = info.date; // 12am on dropped day
        const listId = dateToDayId(droppedDate);

        // ASSUMPTION: drop always occurs from from Later list
        props.setDragOverride({
            sourceOfDrag: {
                droppableId: DO_LATER_LIST_ID,
                index: parseInt(sourceIndex)
            },
            destinationOfDrag: {
                droppableId: listId,
                index: destIndex
            },
            draggableId: id
        });
    }

    // TODO: be able to change the month while dragging?

    const handleEventDrag = (changeInfo: EventChangeArg) => {
        const sourceListId = dateToDayId(changeInfo.oldEvent.start!);
        const destListId = dateToDayId(changeInfo.event.start!);
        
        const itemId = getIdFromEventRepr(changeInfo.event.id);

        const sourceIndex = props.lists[sourceListId].itemIds.indexOf(itemId);
        const destIndex = 0;

        props.mutateLists(
            {
                droppableId: sourceListId,
                index: sourceIndex
            },
            {
                droppableId: destListId,
                index: destIndex
            },
            itemId,
            true
        );
    }

    return (
        <Stack className="grid-cal" h={wrapperHeight} w={wrapperWidth} sx={{ overflow: "hidden" }}>
            <EditItemModal
                editingItem={editingItem}
                saveEditingItem={saveEditingItem}
                deleteEditingItem={deleteEditingItem}
                itemBeingEdited={itemBeingEdited}
                changeItemBeingEdited={changeItemBeingEdited}
            />
            <Stack sx={{ overflow: "scroll" }}>
                <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
                    viewHeight={actualHeight}
                    height={actualHeight}
                    nowIndicator={true}
                    
                    editable={true}
                    events={events.map(x => x as EventInput)}
                    eventChange={handleEventDrag}
                    eventClick={handleEventClick}

                    selectable={false}

                    droppable={true}
                    drop={handleAddItemThroughDrop}

                    headerToolbar={{
                        left: "prev",
                        center: "title",
                        right: "next"
                    }}

                    initialView="dayGridMonth"
                    displayEventTime={false}
                    dayMaxEventRows={true}
                />
            </Stack>
        </Stack>
    );
}

export default GridCalendar;
