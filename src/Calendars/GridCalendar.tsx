import dayjs from "dayjs";
import { v4 as uuid } from "uuid";
import { createRef, useEffect, useState, useRef } from "react";
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
import type { loadingStage } from "../globals";
import { dateToDayId, dayIdToDay, getToday } from "../dateutils";
import { DO_LATER_LIST_ID, Id } from "../globals";

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
    setDragOverride: React.Dispatch<React.SetStateAction<overrideDragEndAttrs | null>>,
    loadStage: loadingStage,
    readonly items: ItemCollection,
    readonly lists: ListCollection,
    createItem: (newItemConfig: ItemRubric, listId: Id) => boolean,
    mutateItem: (itemId: Id, newConfig: Partial<ItemRubric>) => boolean,
    deleteItem: (itemId: Id, listId: Id, index: number) => boolean,
    mutateLists: (sourceOfDrag: DraggableLocation, destinationOfDrag: DraggableLocation, draggableId: Id, createNewLists?: boolean) => boolean,
    delManyItemsOrMutManyLists: (itemIds: Id[], newLists: ListRubric[]) => boolean,
};

const GridCalendar = function(props: GridCalendarProps) {
    const wrapperHeight = "85vh";
    const wrapperWidth = "45vw";
    const actualHeight = "150vh";
    const dummyItem: ItemWithMutationInfo = {
        itemId: uuid(),
        content: "",
        complete: false,
        listId: "",
        index: -1
    }
    const calendarRef = createRef<FullCalendar>();

    const [events, setEvents] = useState<EventList>([]);
    const [editingItem, handlers] = useDisclosure(false);
    const [itemBeingEdited, changeItemBeingEdited] = useState<ItemWithMutationInfo>(dummyItem);

    useEffect(() => {
        // run once on render to initialize the events
        var deletedItemIds: Id[] = [];
        var mutatedLists: ListRubric[] = [];
        for (const listId in props.lists) {
            var list = props.lists[listId];
            var deletedItem = false;
            for (var i = list.itemIds.length - 1; i >= 0; i--) {
                const itemId = list.itemIds[i];
                if (props.items.hasOwnProperty(itemId))
                    continue;
                
                list.itemIds.splice(i, 1);
                deletedItemIds.push(itemId);
                deletedItem = true;
            }
            if (deletedItem)
                mutatedLists.push(list);
        }

        if (mutatedLists.length !== 0 || deletedItemIds.length !== 0) {
            props.delManyItemsOrMutManyLists(deletedItemIds, mutatedLists);
            return;
        }

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

    useEffect(() => {
        // TODO: scroll to current day
        let calendarApi = calendarRef.current!.getApi();
        calendarApi.gotoDate(dayjs().toDate());
    }, [])

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
    // TODO: test this on windows
    const handleEventDrag = (dropInfo: EventDropArg) => {
        const oldDate = dropInfo.oldEvent.start!;
        const newDate = dropInfo.event.start!;
        const itemId = getIdFromEventRepr(dropInfo.event.id);

        const sourceListId = dateToDayId(oldDate);
        const destListId = dateToDayId(newDate);

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
