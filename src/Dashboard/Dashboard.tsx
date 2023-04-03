import { useMemo, useState } from "react";
import { AppShell, Text, Header } from "@mantine/core";
import { useHotkeys } from "@mantine/hooks";
import type { DraggableLocation } from "@hello-pangea/dnd";
import dayjs from "dayjs";

import { Id } from "../globals";
import ActionArea from "./ActionArea";
import LeftPanel from "./LeftPanel";
import type { ItemRubric } from "../Item";
import type { ListRubric, ListCollection } from "../List";
import useDatabase from "../Persistence/useDatabase";
import { dateToDayId } from "../dateutils";
import { DO_LATER_LIST_ID } from "../globals";

interface DashboardProps {};

const Dashboard = function(props: DashboardProps) {
    const actionAreaHeight = "95vh";
    const headerHeight = 50;
    const [date, setDate] = useState<dayjs.Dayjs>(dayjs().startOf("day"));

    // 0: nothing loaded; 1: db updated, need to reload; 2: fully loaded
    const [loadStage, setLoadStage] = useState<(0 | 1 | 2)>(0);
    const [dashboardListCollection, setDashboardListColllection] = useState<ListCollection>({});
    
    const db = useDatabase();

    const getListFromDB = (listId: Id): ListRubric | null => {
        const selectedDayId = dateToDayId(date);
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
        const selectedDayId = dateToDayId(date);
        db.lists.has(selectedDayId).then((res) => {
            if (!res)
                db.lists.create(date).then(() => setLoadStage(1));
            else
                setLoadStage(1);
        });
    }, [date]);

    useMemo(() => {
        const selectedDayId = dateToDayId(date);
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
    }, [loadStage, date, db.lists.data, db.items.data]);

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
            navbar={
                <LeftPanel
                    date={date}
                    setDate={setDate}
                />
            }
            header={
                <Header height={{ base: headerHeight /* , md: 70 */ }} p="md">
                    <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                        <Text ff="JetBrains Mono">
                            {(loadStage === 2) ? "StackBaker" : "Loading..."}
                        </Text>
                    </div>
                </Header>
            }
        >
            {
                (loadStage !== 2) ? <div></div>
                :
                <ActionArea
                    date={date}
                    items={db.items.data!}
                    lists={dashboardListCollection}
                    createItem={createItem}
                    mutateItem={mutateItem}
                    deleteItem={deleteItem}
                    mutateLists={mutateLists}
                />
            }
            
        </AppShell>
    );
}

export default Dashboard;