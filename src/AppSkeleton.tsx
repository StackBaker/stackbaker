import React, { useMemo, useState } from "react";
import { AppShell, Header, Navbar, Text } from "@mantine/core";
import { useHotkeys } from "@mantine/hooks";
import type { DraggableLocation } from "@hello-pangea/dnd";
import dayjs from "dayjs";

import { Id, DO_LATER_LIST_ID } from "./globals";
// import ActionArea from "./ActionArea";
// import LeftPanel from "./LeftPanel";
import type { ItemRubric, ItemCollection } from "./Item";
import type { ListRubric, ListCollection } from "./List";
import useDatabase from "./Persistence/useDatabase";
import { dateToDayId } from "./dateutils";

// 0: nothing loaded; 1: db updated, need to reload; 2: fully loaded
type stageOfLoading = 0 | 1 | 2;

interface useAppSkeletonProps {
    date: dayjs.Dayjs,
    setDate: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>
};

export interface useAppSkeletonOutput {
    date: dayjs.Dayjs,
    setDate: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>,
    loadStage: stageOfLoading,
    items: ItemCollection,
    lists: ListCollection,
    createItem: (newItemConfig: ItemRubric, listId: Id) => boolean,
    mutateItem: (itemId: Id, newConfig: Partial<ItemRubric>) => boolean,
    deleteItem: (itemId: Id, listId: Id, index: number) => boolean,
    mutateLists: (sourceOfDrag: DraggableLocation, destinationOfDrag: DraggableLocation, draggableId: Id) => boolean,
};

const useAppSkeleton = function(props: useAppSkeletonProps): useAppSkeletonOutput {
    const [loadStage, setLoadStage] = useState<stageOfLoading>(0);
    const [dashboardListCollection, setDashboardListColllection] = useState<ListCollection>({});
    
    const db = useDatabase();

    const getListFromDB = (listId: Id): ListRubric | null => {
        const selectedDayId = dateToDayId(props.date);
        if (listId !== selectedDayId && listId !== DO_LATER_LIST_ID)
            return null;
        
        var newList: ListRubric = newList = structuredClone(db.lists.data![listId]);
        
        return newList;
    };

    useMemo(() => {
        db.items.loadAll();
        db.lists.loadAll();
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

        setDashboardListColllection({
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

        var editedItem: ItemRubric = {
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

    const mutateLists = (sourceOfDrag: DraggableLocation, destinationOfDrag: DraggableLocation, draggableId: Id): boolean => {
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
        setLoadStage(1);
        
        return true;
    };

    const log = () => {
        console.log("l", db.lists.data);
        console.log("i", db.items.data);
        console.log("d", dashboardListCollection);
    }

    useHotkeys([
        ['P', log]
    ]);
    return {
        date: props.date,
        setDate: props.setDate,
        loadStage,
        items: db.items.data!,
        lists: dashboardListCollection,
        createItem,
        mutateItem,
        deleteItem,
        mutateLists
    };
}

// TODO: make things readonly?
interface AppSkeletonComponents {
    Header: <HeaderProps>(props: HeaderProps) => JSX.Element,
    LeftPanel: <LeftPanelProps>(props: LeftPanelProps) => ReturnType<typeof Navbar>,
    ActionArea: <ActionAreaProps>(props: ActionAreaProps) => JSX.Element
};

export type AppSkeletonProps = useAppSkeletonProps & AppSkeletonComponents;

const AppSkeleton = function (props: AppSkeletonProps) {
    const actionAreaHeight = "95vh";
    const headerHeight = 50;

    const skeletonHooks = useAppSkeleton({
        date: props.date,
        setDate: props.setDate
    });

    const getSubsetOfSkeletonFuncs = function<T>(): Partial<useAppSkeletonOutput> {
        const x = {} as T;

    }

    const HeaderProps = getSubsetOfSkeletonFuncs(props.HeaderProps);
    const LeftPanelProps = getSubsetOfSkeletonFuncs(props.LeftPanelProps);
    const ActionAreaProps = getSubsetOfSkeletonFuncs(props.ActionAreaProps);

    // have to do this sx thing because AppShell automatically renders too large
    return (
        <AppShell
            sx={{
                main: {
                    minHeight: actionAreaHeight,
                    maxHeight: actionAreaHeight,
                    paddingTop: headerHeight
                }}
            }
            navbarOffsetBreakpoint="sm"
            navbar={props.LeftPanel(LeftPanelProps)}
            header={props.Header(HeaderProps)}
        >
            {
                (skeletonHooks.loadStage !== 2) ? <div></div>
                :
                props.ActionArea(ActionAreaProps)
            }
            
        </AppShell>
    );
}

export default AppSkeleton


