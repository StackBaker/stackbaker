import React, { useMemo, useState } from "react";
import { useHotkeys } from "@mantine/hooks";
import type { DraggableLocation } from "@hello-pangea/dnd";
import dayjs from "dayjs";

import { Id, DO_LATER_LIST_ID, DAY_LIST_ID, DAY_LIST_TITLE } from "./globals";
import type { ItemRubric, ItemCollection } from "./Item";
import type { ListRubric, ListCollection } from "./List";
import type { EventRubric, EventCollection } from "./Calendars/Event";
import useDatabase from "./Persistence/useDatabase";
import { dateToDayId, getToday } from "./dateutils";
import type { UserRubric } from "./Persistence/useUserDB";

// -1: nothing loaded 0: db loaded; 1: db updated, need to reload; 2: fully loaded
export type loadingStage = -1 | 0 | 1 | 2;
export const LOADING_STAGES: { [key: string]: loadingStage } = {
    NOTHING_LOADED: -1,
    DB_LOADED: 0,
    DB_UPDATED: 1,
    READY: 1
}

export interface coordinateBackendAndStateProps {
    date: dayjs.Dayjs,
    setDate: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>
};

export interface coordinateBackendAndStateOutput {
    user: UserRubric,
    date: dayjs.Dayjs,
    setDate: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>,
    loadStage: loadingStage,
    items: ItemCollection,
    lists: ListCollection,
    relevantListCollection: ListCollection,
    events: EventCollection,
    editUser: (newUserConfig: Partial<UserRubric> | null) => boolean,
    createItem: (newItemConfig: ItemRubric, listId: Id) => boolean,
    mutateItem: (itemId: Id, newConfig: Partial<ItemRubric>) => boolean,
    deleteItem: (itemId: Id, listId: Id, index: number) => boolean,
    mutateList: (listId: Id, newConfig: Partial<ListRubric>) => Promise<boolean>,
    mutateLists: (sourceOfDrag: DraggableLocation, destinationOfDrag: DraggableLocation, draggableId: Id, createNewLists?: boolean) => boolean,
    addIncompleteAndLaterToToday: () => boolean,
    saveEvent: (newEventConfig: EventRubric) => boolean,
    deleteEvent: (eventId: Id) => boolean,

    clearEverything: () => void,
};

const coordinateBackendAndState = function(props: coordinateBackendAndStateProps): coordinateBackendAndStateOutput {
    const [loadStage, setLoadStage] = useState<loadingStage>(LOADING_STAGES.NOTHING_LOADED);
    const [relevantListCollection, setRelevantListCollection] = useState<ListCollection>({});
    
    const db = useDatabase();

    const getListFromDB = (listId: Id): ListRubric | null => {
        var newList: ListRubric = structuredClone(db.lists.data![listId]);
        if (!newList)
            return null;
        
        return newList;
    };

    useMemo(() => {
        if (loadStage !== LOADING_STAGES.NOTHING_LOADED)
            return;
        db.user.load().then();
        db.items.loadAll().then();
        db.lists.loadAll().then();
        db.events.loadAll().then();
        setLoadStage(LOADING_STAGES.DB_LOADED);
    }, [loadStage]);

    // TODO: try making the DB functions not async
    useMemo(() => {
        if (loadStage !== LOADING_STAGES.DB_LOADED && loadStage !== LOADING_STAGES.DB_UPDATED)
            return;
        const selectedDayId = dateToDayId(props.date);
        db.lists.has(selectedDayId).then((res) => {
            if (!res) {
                db.lists.create(props.date);
                setLoadStage(LOADING_STAGES.NOTHING_LOADED);
                return;
            }
            
            setLoadStage(LOADING_STAGES.DB_UPDATED);
        });
    }, [loadStage, props.date]);

    useMemo(() => {
        const selectedDayId = dateToDayId(props.date);
        if (loadStage !== LOADING_STAGES.DB_UPDATED || !db.lists.data || !db.lists.data[selectedDayId])
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
        setLoadStage(LOADING_STAGES.READY);
    }, [loadStage, props.date, db.lists.data, db.items.data]);

    const editUser = (newUserConfig: Partial<UserRubric> | null): boolean => {
        let newUserData: UserRubric = { ...db.user.data!, ...newUserConfig };
        if (newUserConfig === null)
            db.user.replaceUser(null);
        else
            db.user.replaceUser(newUserData);
        return true;
    }

    const createItem = (newItemConfig: ItemRubric, listId: Id): boolean => {
        let list = getListFromDB(listId);
        if (list === null) return false;

        list.itemIds.unshift(newItemConfig.itemId);
        db.items.set(newItemConfig.itemId, newItemConfig);
        db.lists.set(listId, list);
        setLoadStage(LOADING_STAGES.DB_UPDATED);

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
        setLoadStage(LOADING_STAGES.DB_UPDATED);

        return true;
    };

    const deleteItem = (itemId: Id, listId: Id, index: number): boolean => {
        let list = getListFromDB(listId);
        if (list === null) return false;

        // delete the item
        list.itemIds.splice(index, 1);
        db.items.del(itemId);
        db.lists.set(listId, list);
        setLoadStage(LOADING_STAGES.DB_UPDATED);

        return true;
    };

    const mutateList = async (listId: Id, newConfig: Partial<ListRubric>): Promise<boolean> => {
        const listThere = await db.lists.has(listId);
        if (!listThere)
            return false;

        const editedList: ListRubric = {
            ...db.lists.data![listId],
            ...newConfig
        };

        db.lists.set(listId, editedList);
        // testing setting load stage because this function is used mainly to store that
        // a particular day has been planned, which occurs just before a navigate
        setLoadStage(LOADING_STAGES.DB_UPDATED);

        return true;
    }

    const mutateLists = (
        sourceOfDrag: DraggableLocation,
        destinationOfDrag: DraggableLocation,
        draggableId: Id,
        createNewLists: boolean = false,
    ): boolean => {
        if (sourceOfDrag.droppableId === destinationOfDrag.droppableId) {
            var list = getListFromDB(sourceOfDrag.droppableId);
            if (list === null)
                if (createNewLists)
                    list = {
                        listId: sourceOfDrag.droppableId,
                        title: DAY_LIST_TITLE,
                        itemIds: [],
                        planned: false
                    };
                else
                    return false;

            var temp = list.itemIds[sourceOfDrag.index];
            list.itemIds[sourceOfDrag.index] = list.itemIds[destinationOfDrag.index];
            list.itemIds[destinationOfDrag.index] = temp;
            db.lists.set(sourceOfDrag.droppableId, list);
        } else {
            var sourceList = getListFromDB(sourceOfDrag.droppableId);
            var destList = getListFromDB(destinationOfDrag.droppableId);

            // Assume that a list can only be null if it is a day list
            if (sourceList === null)
                if (createNewLists)
                    sourceList = {
                        listId: sourceOfDrag.droppableId,
                        title: DAY_LIST_TITLE,
                        itemIds: [],
                        planned: false
                    };
                else
                    return false;
            
            if (destList === null)
                if (createNewLists)
                    destList = {
                        listId: destinationOfDrag.droppableId,
                        title: DAY_LIST_TITLE,
                        itemIds: [],
                        planned: false
                    };
                else
                    return false;
                
            sourceList.itemIds.splice(sourceOfDrag.index, 1);
            destList.itemIds.splice(destinationOfDrag.index, 0, draggableId);
            db.lists.setMany(
                [sourceOfDrag.droppableId, destinationOfDrag.droppableId],
                [sourceList, destList]
            );
        }

        setLoadStage(LOADING_STAGES.DB_UPDATED);
        
        return true;
    };

    const addIncompleteAndLaterToToday = (): boolean => {
        const numPrevDaysToSearch = 3;
        const today = getToday();
        const todayId = dateToDayId(today);
        var todayList = getListFromDB(todayId);

        if (todayList === null || todayList.planned)
            return false;
        
        
        // find all the IDs of previous days to check for incomplete tasks
        var prevDayIds = [];
        for (var i = 1; i <= numPrevDaysToSearch; i++) {
            prevDayIds.push(dateToDayId(today.add(-1 * i, "days")));
        }
        // also check for tasks in the later list
        prevDayIds.push(DO_LATER_LIST_ID);

        var incompleteTasks = [];
        var newPrevDayIds = []
        var newPrevDayLists = [];
        for (const prevDayId of prevDayIds) {
            var prevDayList = getListFromDB(prevDayId);
            if (!prevDayList)
                continue;
            
            for (var i = prevDayList.itemIds.length - 1; i >= 0; i--) {
                const itemId = prevDayList.itemIds[i];
                if (!db.items.data || db.items.data![itemId].complete)
                    continue;
                
                // the task is incomplete, add it to the incomplete Tasks arr
                incompleteTasks.push(itemId);
                // remove it from this day's itemIds
                prevDayList.itemIds.splice(i, 1);
            }

            newPrevDayIds.push(prevDayId);
            newPrevDayLists.push(prevDayList);
        }

        todayList.itemIds = incompleteTasks.concat(todayList.itemIds);

        db.lists.setMany(newPrevDayIds.concat([todayId]), newPrevDayLists.concat(todayList));
        console.log(newPrevDayLists)
        setLoadStage(LOADING_STAGES.DB_UPDATED);

        return true;
    }

    const saveEvent = (newEventConfig: EventRubric): boolean => {
        db.events.set(newEventConfig.id, newEventConfig);
        return true;
    }

    const deleteEvent = (eventId: Id): boolean => {
        db.events.del(eventId);
        return true;
    }

    const clearEverything = (): void => {
        props.setDate(getToday());
        db.user.clear();
        db.lists.clear();
        db.items.clear();
        db.events.clear();
        setLoadStage(LOADING_STAGES.NOTHING_LOADED);
    }

    const log = () => {
        console.log("l", db.lists.data);
        console.log("i", db.items.data);
        console.log("d", relevantListCollection);
        console.log("e", db.events.data);
        console.log("u", db.user.data);
        console.log("s", loadStage);
    }

    // TODO: put this back for debugging
    useHotkeys([
        ['P', log]
    ]);

    return {
        user: db.user.data!,
        date: props.date,
        setDate: props.setDate,
        loadStage,
        items: db.items.data!,
        lists: db.lists.data!,
        relevantListCollection,
        editUser: editUser,
        createItem,
        mutateItem,
        deleteItem,
        mutateList,
        mutateLists,
        addIncompleteAndLaterToToday,
        events: db.events.data!,
        saveEvent,
        deleteEvent,
        clearEverything
    };
}

export default coordinateBackendAndState;
