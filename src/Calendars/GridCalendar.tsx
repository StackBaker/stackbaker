import dayjs from "dayjs";
import { v4 as uuid } from "uuid";
import React, { createRef, useEffect, useState, useRef, useContext } from "react";
import { createStyles, ActionIcon, TextInput, Text, Group, Modal, Stack } from "@mantine/core";
import { getHotkeyHandler, useDisclosure } from "@mantine/hooks";
import FullCalendar from "@fullcalendar/react";
import interactionPlugin, { EventDragStartArg, EventDragStopArg } from "@fullcalendar/interaction";
import type { DropArg } from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import type { EventAddArg, EventRemoveArg, EventClickArg, EventInput, EventDropArg } from "@fullcalendar/core";
import type { DraggableLocation } from "@hello-pangea/dnd";
import DeleteIcon from "@mui/icons-material/Delete";

import { createEventReprId, getIdFromEventRepr } from "./Event";
import type { EventList } from "./Event";
import "./fullcalendar-vars.css";
import { ID_IDX_DELIM } from "../Item";
import type { ItemCollection, ItemRubric } from "../Item";
import type { ListCollection, ListRubric } from "../List";
import { dateToDayId, dayIdToDay, getToday } from "../dateutils";
import { DO_LATER_LIST_ID, Id, PriorityLevel } from "../globals";
import { CoordinationContext } from "../coordinateBackendAndState";

type ItemWithMutationInfo = ItemRubric & { listId: Id };

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
			<Group w="100%" align="stretch" m="xs">
				<TextInput
					ref={inputRef}
					label="Content"
					miw="90%"
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
    setDragOverride: React.Dispatch<React.SetStateAction<overrideDragEndAttrs | null>>
};

const GridCalendar = function(props: GridCalendarProps) {
    // TODO: use the Mantine datepicker?
    const coordination = useContext(CoordinationContext);

    const wrapperHeight = "85vh";
    const wrapperWidth = "45vw";
    const actualHeight = "150vh";
    const dummyItem: ItemWithMutationInfo = {
        itemId: uuid(),
        content: "",
        complete: false,
        duration: coordination.user.defaultEventLength,
        priority: PriorityLevel.VeryLow,
        listId: "",
        index: -1
    }
    const calendarRef = createRef<FullCalendar>();

    const [events, setEvents] = useState<EventList>([]);
    const [editingItem, handlers] = useDisclosure(false);
    const [itemBeingEdited, changeItemBeingEdited] = useState<ItemWithMutationInfo>(dummyItem);

    useEffect(() => {
        // run once on render to initialize the events
        // QUESTION: what does this do?
        var deletedItemIds: Id[] = [];
        var mutatedLists: ListRubric[] = [];
        for (const listId in coordination.lists) {
            var list = coordination.lists[listId];
            var deletedItem = false;
            for (var i = list.itemIds.length - 1; i >= 0; i--) {
                const itemId = list.itemIds[i];
                if (coordination.items.hasOwnProperty(itemId))
                    continue;
                
                list.itemIds.splice(i, 1);
                deletedItemIds.push(itemId);
                deletedItem = true;
            }
            if (deletedItem)
                mutatedLists.push(list);
        }

        if (mutatedLists.length !== 0 || deletedItemIds.length !== 0) {
            coordination.delManyItemsOrMutManyLists(deletedItemIds, mutatedLists);
            return;
        }

        setEvents(
            Object.keys(coordination.lists).reduce((prev, cur) => {
                return prev.concat(coordination.lists[cur].itemIds.map((k) => ({
                    id: createEventReprId(coordination.items[k].itemId),
                    title: coordination.items[k].content,
                    start: dayIdToDay(cur).toDate(),
                    end: dayIdToDay(cur).add(1, "hour").toDate()
                })));
            }, [] as EventList)
        );
    }, [coordination.lists, coordination.items]);

    const handleEventClick = (clickInfo: EventClickArg) => {
        const id = getIdFromEventRepr(clickInfo.event.id);
        const dayId = dateToDayId(clickInfo.event.start!);
        const index = coordination.lists[dayId].itemIds.indexOf(id);
        const item: ItemWithMutationInfo = { ...coordination.items[id], listId: dayId };
        changeItemBeingEdited(item);
        handlers.open();
    }

    const saveEditingItem = () => {
        if (itemBeingEdited.content === "") {
            return;
        }

        handlers.close();
        const { listId, index, ...rest  } = itemBeingEdited;
        coordination.mutateItem(rest.itemId, rest);
        changeItemBeingEdited(dummyItem);
    }
    
    const deleteEditingItem = () => {
        handlers.close();
        const { listId, index, ...rest } = itemBeingEdited;
        coordination.deleteItem(rest.itemId, listId, index);
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
    const handleEventDrag = (dropInfo: EventDropArg) => {
        const oldDate = dropInfo.oldEvent.start!;
        const newDate = dropInfo.event.start!;
        const itemId = getIdFromEventRepr(dropInfo.event.id);

        const sourceListId = dateToDayId(oldDate);
        const destListId = dateToDayId(newDate);

        const sourceIndex = coordination.lists[sourceListId].itemIds.indexOf(itemId);
        const destIndex = 0;

        coordination.dragBetweenLists(
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
                    ref={calendarRef}
                    plugins={[dayGridPlugin, interactionPlugin]}
                    viewHeight={actualHeight}
                    height={actualHeight}
                    
                    editable={true}
                    eventDrop={handleEventDrag}
                    eventClick={handleEventClick}
                    events={events.map(x => x as EventInput)}

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
                    now={getToday().toDate()}
                    scrollTime={dayjs().format("HH:00")}
                />
            </Stack>
        </Stack>
    );
}

export default GridCalendar;
