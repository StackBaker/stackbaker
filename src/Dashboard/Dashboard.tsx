import { useEffect, useMemo, useState } from "react";
import { AppShell, Text, MediaQuery, Header, Burger } from "@mantine/core";
import { useHotkeys } from "@mantine/hooks";
import type { DraggableLocation } from "@hello-pangea/dnd";
import dayjs from "dayjs";

import type { Id } from "../globals";
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

    useMemo(() => {
        db.items.loadAll();
        db.lists.loadAll();
    }, []);

    useMemo(() => {
        setLoadStage(0);
        const selectedDayId = dateToDayId(date);
        db.lists.has(selectedDayId).then((res) => {
            if (!res) {
                db.lists.create(date).then(() => setLoadStage(1));
            } else {
                setLoadStage(1);
            }
        });
    }, [date]);

    useMemo(() => {
        if (loadStage !== 1 || !db.lists.data) {
            return;
        }

        const selectedDayId = dateToDayId(date);
        setDashboardListColllection({
            [selectedDayId]: db.lists.data![selectedDayId],
            [DO_LATER_LIST_ID]: db.lists.data![DO_LATER_LIST_ID]
        });
        setLoadStage(2);
    }, [loadStage, date, db.lists.data]);

    const getListFromDB = (listId: Id): { success: boolean, list: ListRubric } => {
        const selectedDayId = dateToDayId(date);
        if (listId !== selectedDayId && listId !== DO_LATER_LIST_ID) {
            return { success: false, list: {} as ListRubric };
        }
        let newList: ListRubric;
        if (listId === selectedDayId)
            newList = db.lists.data![selectedDayId];
        else
            newList = db.lists.data![DO_LATER_LIST_ID];
        
        return { success: true, list: newList };
    }

    const createItem = (newItemConfig: ItemRubric, listId: Id): boolean => {
        let { success, list } = getListFromDB(listId);
        if (!success) return false;

        list.itemIds.push(newItemConfig.itemId);
        db.items.set(newItemConfig.itemId, newItemConfig);
        db.lists.set(listId, list);
        setLoadStage(1);

        return true;
    };

    const mutateItem = (itemId: Id, newConfig: Partial<ItemRubric>): boolean => {
        if (!db.items.data?.hasOwnProperty(itemId)) {
            return false;
        }

        var editedItem: ItemRubric = {
            ...db.items.data![itemId],
            ...newConfig
        };

        db.items.set(itemId, editedItem);
        setLoadStage(1);

        return true;
    };

    const deleteItem = (itemId: Id, listId: Id, index: number): boolean => {
        let { success, list } = getListFromDB(listId);
        if (!success) return false;

        // delete the item
        list.itemIds.splice(index, 1);
        db.items.del(itemId);
        db.lists.set(listId, list);
        setLoadStage(1);

        return true;
    };

    const mutateLists = (sourceOfDrag: DraggableLocation, destinationOfDrag: DraggableLocation, draggableId: Id): boolean => {
        let { success: sourceSuccess, list: sourceList } = getListFromDB(sourceOfDrag.droppableId);
        let { success: destSuccess, list: destList } = getListFromDB(sourceOfDrag.droppableId);

        if (!sourceSuccess || !destSuccess) {
            return false;
        }

        sourceList.itemIds.splice(sourceOfDrag.index, 1);
        destList.itemIds.splice(destinationOfDrag.index, 0, draggableId);

        db.lists.set(sourceOfDrag.droppableId, sourceList);
        db.lists.set(destinationOfDrag.droppableId, destList);

        setLoadStage(1);

        return true;
    };

    const log = () => {
        console.log("l", db.lists.data);
        console.log("i", db.items.data);
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
                (loadStage < 2) ? <div></div>
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