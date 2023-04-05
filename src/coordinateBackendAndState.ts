import React, { useMemo, useState } from "react";
import { useHotkeys } from "@mantine/hooks";
import type { DraggableLocation } from "@hello-pangea/dnd";
import dayjs from "dayjs";

import { Id, DO_LATER_LIST_ID } from "./globals";
import type { ItemRubric, ItemCollection } from "./Item";
import type { ListRubric, ListCollection } from "./List";
import type { EventRubric, EventCollection } from "./Calendars/Event";
import useDatabase from "./Persistence/useDatabase";
import { dateToDayId } from "./dateutils";

// 0: nothing loaded; 1: db updated, need to reload; 2: fully loaded
export type loadingStage = 0 | 1 | 2;

export interface coordinateBackendAndStateProps {
    date: dayjs.Dayjs,
    setDate: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>
};

export interface coordinateBackendAndStateOutput {
    date: dayjs.Dayjs,
    setDate: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>,
    loadStage: loadingStage,
    items: ItemCollection,
    lists: ListCollection,
    events: EventCollection,
    createItem: (newItemConfig: ItemRubric, listId: Id) => boolean,
    mutateItem: (itemId: Id, newConfig: Partial<ItemRubric>) => boolean,
    deleteItem: (itemId: Id, listId: Id, index: number) => boolean,
    mutateList: (listId: Id, newConfig: Partial<ListRubric>) => Promise<boolean>,
    mutateLists: (sourceOfDrag: DraggableLocation, destinationOfDrag: DraggableLocation, draggableId: Id) => boolean,
    saveEvent: (newEventConfig: EventRubric) => boolean,
    deleteEvent: (eventId: Id) => boolean
};

const coordinateBackendAndState = function(props: coordinateBackendAndStateProps): coordinateBackendAndStateOutput {
    const [loadStage, setLoadStage] = useState<loadingStage>(0);
    const [relevantListCollection, setRelevantListCollection] = useState<ListCollection>({});
    
    const db = useDatabase();

    const getListFromDB = (listId: Id): ListRubric | null => {
        const selectedDayId = dateToDayId(props.date);
        if (listId !== selectedDayId && listId !== DO_LATER_LIST_ID)
            return null;
        
        var newList: ListRubric = structuredClone(db.lists.data![listId]);
        
        return newList;
    };

    useMemo(() => {
        db.items.loadAll();
        db.lists.loadAll();
        db.events.loadAll();
    }, []);

    useMemo(() => {
        setLoadStage(0);
        const selectedDayId = dateToDayId(props.date);
        db.lists.has(selectedDayId).then((res) => {
            if (!res)
                db.lists.create(props.date).then(() => setLoadStage(1));
            else
                setLoadStage(1);
        });
    }, [props.date]);

    useMemo(() => {
        const selectedDayId = dateToDayId(props.date);
        if (loadStage !== 1 || !db.lists.data || !db.lists.data[selectedDayId])
            return;

        var selectedDayList = null
        while (selectedDayList === null)
            selectedDayList = getListFromDB(selectedDayId);

        var laterList = null;
        while (laterList === null)
            laterList = getListFromDB(DO_LATER_LIST_ID);

        setRelevantListCollection({
            [selectedDayId]: selectedDayList,
            [DO_LATER_LIST_ID]: laterList
        });
        setLoadStage(2);
    }, [loadStage, props.date, db.lists.data, db.items.data]);

    const createItem = (newItemConfig: ItemRubric, listId: Id): boolean => {
        let list = getListFromDB(listId);
        if (list === null) return false;

        list.itemIds.push(newItemConfig.itemId);
        db.items.set(newItemConfig.itemId, newItemConfig);
        db.lists.set(listId, list);
        setLoadStage(1);

        return true;
    };

    const mutateItem = (itemId: Id, newConfig: Partial<ItemRubric>): boolean => {
        if (!db.items.data?.hasOwnProperty(itemId))
            return false;

        const editedItem: ItemRubric = {
            ...db.items.data![itemId],
            ...newConfig
        };

        db.items.set(itemId, editedItem)
        setLoadStage(1);

        return true;
    };

    const deleteItem = (itemId: Id, listId: Id, index: number): boolean => {
        let list = getListFromDB(listId);
        if (list === null) return false;

        // delete the item
        list.itemIds.splice(index, 1);
        db.items.del(itemId);
        db.lists.set(listId, list);
        setLoadStage(1);

        return true;
    };

    const mutateList = async (listId: Id, newConfig: Partial<ListRubric>): Promise<boolean> => {
        const listThere = await db.lists.has(listId);
        if (!listThere)
            return new Promise((resolve, reject) => reject("List not there"));

        const editedList: ListRubric = {
            ...db.lists.data![listId],
            ...newConfig
        };

        console.log("s", editedList);

        await db.lists.set(listId, editedList);

        return new Promise((resolve, reject) => resolve(true));
    }

    const mutateLists = (sourceOfDrag: DraggableLocation, destinationOfDrag: DraggableLocation, draggableId: Id): boolean => {
        if (sourceOfDrag.droppableId === destinationOfDrag.droppableId) {
            var list = getListFromDB(sourceOfDrag.droppableId);
            if (list === null)
                return false;

            var temp = list.itemIds[sourceOfDrag.index];
            list.itemIds[sourceOfDrag.index] = list.itemIds[destinationOfDrag.index];
            list.itemIds[destinationOfDrag.index] = temp;
            db.lists.set(sourceOfDrag.droppableId, list);
        } else {
            var sourceList = getListFromDB(sourceOfDrag.droppableId);
            var destList = getListFromDB(destinationOfDrag.droppableId);

            if (sourceList === null || destList === null)
                return false;
            sourceList.itemIds.splice(sourceOfDrag.index, 1);
            destList.itemIds.splice(destinationOfDrag.index, 0, draggableId);
            db.lists.setMany(
                [sourceOfDrag.droppableId, destinationOfDrag.droppableId],
                [sourceList, destList]
            );
        }

        setLoadStage(1);
        
        return true;
    };

    const saveEvent = (newEventConfig: EventRubric): boolean => {
        db.events.set(newEventConfig.id, newEventConfig);
        return true;
    }

    const deleteEvent = (eventId: Id): boolean => {
        db.events.del(eventId);
        return true;
    }

    const log = () => {
        console.log("l", db.lists.data);
        console.log("i", db.items.data);
        console.log("d", relevantListCollection);
        console.log("e", db.events.data);
        console.log("t", props.date);
    }

    useHotkeys([
        ['P', log]
    ]);
    return {
        date: props.date,
        setDate: props.setDate,
        loadStage,
        items: db.items.data!,
        lists: relevantListCollection,
        createItem,
        mutateItem,
        deleteItem,
        mutateList,
        mutateLists,
        events: db.events.data!,
        saveEvent,
        deleteEvent
    };
}

export default coordinateBackendAndState;
