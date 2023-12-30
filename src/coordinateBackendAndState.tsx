import React, { useMemo, useState } from "react";
import { useHotkeys } from "@mantine/hooks";
import type { DraggableLocation } from "@hello-pangea/dnd";
import dayjs from "dayjs";

import { Id, DO_LATER_LIST_ID, myStructuredClone } from "./globals";
import type { ItemRubric } from "./Item";
import type { ListRubric, ListCollection } from "./List";
import type { EventRubric, EventCollection } from "./Calendars/Event";
import useDatabase from "./Persistence/useDatabase";
import { dateToDayId, getToday } from "./dateutils";
import type { UserRubric } from "./Persistence/useUserDB";
import { LoadingStage } from "./globals";

interface coordinateBackendAndStateProps {
    date: dayjs.Dayjs,
    setDate: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>,
    loadStage: LoadingStage,
    setLoadStage: React.Dispatch<React.SetStateAction<LoadingStage>>
};

type coordinateBackendAndStateOutput = {
    _db: { user: any, lists: any, events: any },
    user: UserRubric,
    loadStage: LoadingStage,
    lists: ListCollection,
    relevantListCollection: ListCollection,
    events: EventCollection,
    editUser: (newUserConfig: Partial<UserRubric> | null) => boolean,
    createItem: (newItemConfig: ItemRubric, listId: Id) => boolean,
    mutateItem: (itemId: Id, newConfig: Partial<ItemRubric>, listId: Id) => boolean,
    toggleItemComplete: (itemId: Id, listId: Id) => boolean,
    deleteItem: (itemId: Id, listId: Id, index: number) => boolean,
    mutateList: (listId: Id, newConfig: Partial<ListRubric>) => Promise<boolean>,
    dragBetweenLists: (sourceOfDrag: DraggableLocation, destinationOfDrag: DraggableLocation, draggableId: Id, createNewLists?: boolean) => boolean,
    addIncompleteAndLaterToToday: () => boolean,
    saveEvent: (newEventConfig: EventRubric) => boolean,
    deleteEvent: (eventId: Id) => boolean,

    clearEverything: () => void,
};

const _coordinateBackendAndState = function(props: coordinateBackendAndStateProps): coordinateBackendAndStateOutput {    
    const db = useDatabase();
    const selectedDayId = dateToDayId(props.date);

    const getListFromDB = (listId: Id): ListRubric | null => {
        if (!db.lists.data || !db.lists.data.hasOwnProperty(listId)) {
            return null;
        }
        
        var newList: ListRubric | null = myStructuredClone(db.lists.data![listId]);

        return newList;
    };

    useMemo(async () => {
        if (props.loadStage !== LoadingStage.NothingLoaded) {
            return;
        }
        await db.user.load();
        await db.lists.load();
        await db.events.load();

        props.setLoadStage(LoadingStage.DBLoaded);
    }, [props.loadStage]);

    // try to create the list for the selected day
    useMemo(() => {
        if (props.loadStage !== LoadingStage.DBLoaded) {
            return;
        }
        
        db.lists.hasList(selectedDayId).then(async (res) => {
            if (!res) {
                db.lists.createList(props.date);
                props.setLoadStage(LoadingStage.NothingLoaded);
                return;
            }
            
            props.setLoadStage(LoadingStage.DBUpdated);
        });
    }, [props.loadStage, props.date]);

    useMemo(() => {
        if (props.loadStage !== LoadingStage.DBUpdated) {
            return;
        }
        
        var selectedDayList = getListFromDB(selectedDayId);
        var laterList = getListFromDB(DO_LATER_LIST_ID);
        if (selectedDayList === null || laterList === null) {
            props.setLoadStage(LoadingStage.NothingLoaded);
            return;
        }

        props.setLoadStage(LoadingStage.Ready);
    }, [props.loadStage, props.date]);

    // reset the coordinator upon date change
    useMemo(() => {
        if (props.loadStage !== LoadingStage.Ready) {
            return;
        }

        props.setLoadStage(LoadingStage.NothingLoaded);
    }, [props.date]);

    const editUser = (newUserConfig: Partial<UserRubric> | null): boolean => {
        let newUserData: UserRubric = { ...db.user.data!, ...newUserConfig };
        if (newUserConfig === null) {
            db.user.replaceUser(null);
        } else {
            db.user.replaceUser(newUserData);
        }
        return true;
    }

    const createItem = (newItemConfig: ItemRubric, listId: Id): boolean => {
        let list = getListFromDB(listId);
        if (list === null) {
            return false;
        }

        const numItems = Object.keys(list.items).length;
        let idx = newItemConfig.index;
        // bound the index to the length of the list
        idx = Math.max(0, Math.min(idx, numItems));

        Object.keys(list.items).forEach((itemId) => {
            // for each item in the list
            const itm = list!.items[itemId];
            if (itm.index < idx) {
                return;
            }

            // if the index of itm is >= newItemConfig.index
            // increment the index of itm
            list!.items[itemId].index += 1;
        });

        // add the new item to the list
        list!.items[newItemConfig.itemId] = newItemConfig;
        db.lists.setList(listId, list);
        return true;
    };

    const mutateItem = (itemId: Id, newConfig: Partial<ItemRubric>, listId: Id): boolean => {
        let list = getListFromDB(listId);
        if (list === null) {
            return false;
        }

        // prevent the index from being mutated through this function
        const editedItem: ItemRubric = {
            ...list!.items[itemId],
            ...newConfig,
            index: list!.items[itemId].index
        }

        db.lists.setItem(itemId, editedItem, listId);

        return true;
    };

    const toggleItemComplete = (itemId: Id, listId: Id): boolean => {
        let list = getListFromDB(listId);
        if (list === null || !list.items.hasOwnProperty(itemId)) {
            return false;
        }
        
        const prevComplete = list.items[itemId].complete;
        const numItems = Object.keys(list.items).length;

        let newIndex: number;
        if (!prevComplete) {
            // it was previously incomplete, now it is complete, push to bottom
            newIndex = numItems;
        } else {
            // it was previously complete, now it is incomplete, push to top
            newIndex = 0;
        }

        Object.keys(list.items).forEach((itmId) => {
            // for each item in the list
            const itm = list!.items[itmId];
            if (itm.index < newIndex) {
                return;
            }

            // if the index of itm is >= newItemConfig.index
            // increment the index of itm
            list!.items[itmId].index += 1;
        });

        const editedItem: ItemRubric = {
            ...list.items[itemId],
            index: newIndex,
            complete: !prevComplete
        };

        list.items[itemId] = editedItem;
        db.lists.setList(listId, list);
    
        return true;
    }

    const deleteItem = (itemId: Id, listId: Id): boolean => {
        let list = getListFromDB(listId);
        if (list === null || !list.items.hasOwnProperty(itemId)){
            return false;
        }

        let index: number = list.items[itemId].index;
        // delete the item
        delete list.items[itemId];

        // update the indices of all the other items
        Object.keys(list.items).forEach((itmId) => {
            // for each item in the list
            const itm = list!.items[itmId];
            if (itm.index < index) {
                return;
            }

            // if the index of itm is >= newItemConfig.index
            // decrement the index of itm
            list!.items[itmId].index -= 1;
        });

        db.lists.setList(listId, list);
        return true;
    };

    const mutateList = async (listId: Id, newConfig: Partial<ListRubric>): Promise<boolean> => {
        const listThere = await db.lists.hasList(listId);
        if (!listThere) {
            return false;
        }

        const editedList: ListRubric = {
            ...db.lists.data![listId],
            ...newConfig
        };

        db.lists.setList(listId, editedList);
        return true;
    }

    const dragBetweenLists = (
        sourceOfDrag: DraggableLocation,
        destinationOfDrag: DraggableLocation,
        draggableId: Id,
        createNewLists: boolean = false,
    ): boolean => {
        const _getOrCreateList = (listId: Id, create: boolean): ListRubric | null => {
            let list: ListRubric | null = getListFromDB(listId);
            if (list === null) {
                if (create) {
                    list = {
                        listId: listId,
                        planned: false,
                        items: {}
                    };
                } else {
                    return null;
                }
            }

            return list;
        }

        if (sourceOfDrag.droppableId === destinationOfDrag.droppableId) {
            let list: ListRubric | null = _getOrCreateList(sourceOfDrag.droppableId, createNewLists);
            if (list === null) {
                return false;
            }

            // need to search for the item that has the index
            let tempItem: ItemRubric | null = null;
            for (const itemId in list.items) {
                if (list.items[itemId].index === sourceOfDrag.index) {
                    tempItem = list.items[itemId];
                }
            }
            
            if (tempItem === null) {
                return false;
            }
            
            Object.keys(list.items).forEach((itemId) => {
                // move everything past the source one down
                if (list!.items[itemId].index > sourceOfDrag.index) {
                    list!.items[itemId].index -= 1;
                }

                // move everything past and including the destination one up
                if (list!.items[itemId].index >= destinationOfDrag.index) {
                    list!.items[itemId].index += 1;
                }
            });

            // place the dragged item at the new index
            list.items[draggableId].index = destinationOfDrag.index;
            db.lists.setList(sourceOfDrag.droppableId, list);
        } else {
            var sourceList = _getOrCreateList(sourceOfDrag.droppableId, createNewLists);
            var destList = _getOrCreateList(destinationOfDrag.droppableId, createNewLists);

            if (sourceList === null || destList === null) {
                return false;
            }

            Object.keys(sourceList.items).forEach((itemId) => {
                // move everything past the source one down
                if (sourceList!.items[itemId].index > sourceOfDrag.index) {
                    sourceList!.items[itemId].index -= 1;
                }
            });
            // delete the item from the source list
            let draggedItem = myStructuredClone(sourceList.items[draggableId]);
            delete sourceList.items[draggableId];
            draggedItem.index = destinationOfDrag.index;

            Object.keys(destList.items).forEach((itemId) => {
                // move everything past and including the destination up one
                if (destList!.items[itemId].index >= destinationOfDrag.index) {
                    destList!.items[itemId].index += 1;
                }
            });
            // place the dragged item at the destination
            destList.items[draggableId] = draggedItem;

            db.lists.setManyLists(
                [sourceList, destList]
            );
        }
        
        return true;
    };

    const addIncompleteAndLaterToToday = (): boolean => {
        const numPrevDaysToSearch = 3;
        const today = getToday();
        const todayId = dateToDayId(today);
        var todayList = getListFromDB(todayId);

        if (todayList === null || todayList.planned) {
            return false;
        }
        
        // find all the IDs of previous days to check for incomplete tasks
        var prevDayIds = [];
        for (var i = 1; i <= numPrevDaysToSearch; i++) {
            prevDayIds.push(dateToDayId(today.add(-1 * i, "days")));
        }
        // also check for tasks in the later list
        prevDayIds.push(DO_LATER_LIST_ID);
        
        let numTodayItems = Object.keys(todayList.items).length;
        let updatedLists: ListRubric[] = [];
        for (const prevDayId of prevDayIds) {
            let prevDayList = getListFromDB(prevDayId);
            if (prevDayList === null) {
                continue;
            }
            
            let removedIndices: number[] = [];
            let removedIds: Id[] = [];
            Object.keys(prevDayList.items).forEach((itemId) => {
                if (!prevDayList!.items[itemId].complete) {
                    // add the item to today 
                    const itemToAddToToday = {
                        ...prevDayList!.items[itemId],
                        index: numTodayItems
                    }
                    numTodayItems += 1;
                    todayList!.items[itemId] = itemToAddToToday;

                    // record that this Id should be removed from prevDayList
                    removedIds.push(itemId);
                    removedIndices.push(prevDayList!.items[itemId].index);
                }
            })

            // remove the ids of items that were removed
            for (const idToRemove of removedIds) {
                delete prevDayList.items[idToRemove];
            }
            // update the indices of the other elements
            Object.keys(prevDayList.items).forEach((itemId) => {
                for (const idx of removedIndices) {
                    if (prevDayList!.items[itemId].index > idx) {
                        prevDayList!.items[itemId].index -= 1;
                    }
                }
            });

            updatedLists.push(prevDayList);
        }

        db.lists.setManyLists(updatedLists.concat([todayList]));
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

    const clearEverything = () => {
        db.user.clear();
        db.lists.clear();
        db.events.clear();
        props.setDate(getToday());
        props.setLoadStage(LoadingStage.NothingLoaded);
    }

    const log = () => {
        console.log("l", db.lists.data);
        console.log("e", db.events.data);
        console.log("u", db.user.data);
        console.log("s", props.loadStage);
    }

    useHotkeys([
        ['P', log]
    ]);

    // useMemo is executed inline with the component if the dependencies have changed
    // so it should execute before the function returns, i.e before all of this is returned
    // meaning the lists and items and such should never be undefined when returned
    // even if we are rendering the first time (which should trigger a rerender when changing loadingStage)
    // because the first render should load everything from the DB synchronously.
    return {
        _db: db,
        user: db.user.data!,
        loadStage: props.loadStage,
        lists: db.lists.data!,
        relevantListCollection: {
            [selectedDayId]: getListFromDB(selectedDayId)!,
            [DO_LATER_LIST_ID]: getListFromDB(DO_LATER_LIST_ID)!
        },
        editUser: editUser,
        createItem,
        mutateItem,
        toggleItemComplete,
        deleteItem,
        mutateList,
        dragBetweenLists,
        addIncompleteAndLaterToToday,
        events: db.events.data!,
        saveEvent,
        deleteEvent,
        clearEverything
    };
}

// ASSUMPTION: CoordinationContext will not be used anywhere except under
// ASSUMPTION: the CoordinationProvider exported below
// @ts-expect-error
export const CoordinationContext = React.createContext<coordinateBackendAndStateOutput>();

interface CoordinationProviderProps {
    date: dayjs.Dayjs,
    setDate: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>,
    children: React.ReactNode
}

const CoordinationProvider = function(props: CoordinationProviderProps) {
    const [loadStage, setLoadStage] = useState<LoadingStage>(LoadingStage.NothingLoaded);
    const coordFunctions = _coordinateBackendAndState({
        date: props.date,
        setDate: props.setDate,
        loadStage,
        setLoadStage,
    });

    return (
        <CoordinationContext.Provider value={coordFunctions}>
            {props.children}
        </CoordinationContext.Provider>
    );
}

export default CoordinationProvider;


