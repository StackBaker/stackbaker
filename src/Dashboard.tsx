import { useEffect, useMemo, useState } from "react";
import { createStyles, Button, AppShell, Navbar, Text, MediaQuery, Header, Burger, Group, Paper, Space } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { DragDropContext } from "@hello-pangea/dnd";
import type { DropResult, DraggableLocation } from "@hello-pangea/dnd"
import { useHotkeys } from "@mantine/hooks";
import dayjs from "dayjs";

import List from "./List";
import DayCalendar from "./Calendars/DayCalendar";
import { DAY_LIST_ID, DO_LATER_LIST_ID, DAY_LIST_TITLE, DO_LATER_LIST_TITLE } from "./globals";
import type { Id } from "./globals";
import type { LeftPanelProps, ActionAreaProps, DashboardProps } from "./DashboardTypes";
import type { ItemRubric, ItemCollection } from "./Item";
import type { ListRubric, ListCollection } from "./List";
import useDatabase from "./Persistence/useDatabase";
import { dateToDayId } from "./dateutils";

const useStyles = createStyles((theme) => ({
    wrapper: {},
    leftPanel: {},
    actionArea: {}
}));

const LeftPanel = function(props: LeftPanelProps) {
    const { classes } = useStyles();

    return (
        <Navbar
            className={classes.leftPanel}
            p="md"
            hiddenBreakpoint="sm"
            hidden={!props.opened}
            width={{ sm: 250, lg: 250 }}
        >
            <Navbar.Section>
                <DatePicker
                    value={props.date.toDate()}
                    onChange={(v) => props.setDate(dayjs(v))}
                    size="xs"
                />
                <Space h="lg"></Space>
                <Button fullWidth onClick={() => props.setDate(dayjs().startOf("day"))}>Today</Button>
            </Navbar.Section>
            <Navbar.Section grow>{}</Navbar.Section>
            <Navbar.Section>TODO: local weather:maybe WeatherKit?</Navbar.Section>
            <Navbar.Section>TODO: Account Settings</Navbar.Section>
        </Navbar>
    );
}

const ActionArea = function(props: ActionAreaProps) {
    const { classes } = useStyles();
    const listWidth = "250px";

    const onDragEnd = function(result: DropResult) {
        const { source, destination, draggableId } = result;

        if (!destination || (source.droppableId === destination.droppableId &&
            source.index === destination.index)) {
            return;
        }

        props.mutateLists(source, destination, draggableId);
    }

    // TODO: implement undo with mod+Z
    // TODO: maybe header can display loading messages while retrieving stuff from backend
    // TODO: or retrieving stuff from GCal
    return (
        <DragDropContext
            onDragEnd={onDragEnd}
        >
            <Group
                className={classes.actionArea}
                position="left"
                spacing="lg"
                align="flex-start"
            >
                <DayCalendar
                    height="80vh"
                    width="310px"
                    currentDay={props.date.startOf("day")}
                    items={props.items}
                />
                {Object.keys(props.lists).map(tlid => {
                    return (
                        <List
                            key={tlid}
                            items={props.items}
                            createItem={props.createItem}
                            mutateItem={props.mutateItem}
                            deleteItem={props.deleteItem}
                            mutateLists={props.mutateLists}
                            {...props.lists[tlid]}
                        />
                    )})}
            </Group>
        </DragDropContext>
    );
}
const Dashboard = function(props: DashboardProps | undefined) {
    const actionAreaHeight = "95vh";
    const headerHeight = 50;
    const [date, changeDate] = useState<dayjs.Dayjs>(dayjs().startOf("day"));
    const [opened, setOpened] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const setDate = (newDate: dayjs.Dayjs) => {
        changeDate(newDate);
        setLoaded(false);
    }

    const db = useDatabase();
    useEffect(() => {
        db.items.loadAll();
        db.lists.loadAll();
    }, []);

    useEffect(() => {
        if (loaded) {
            return;
        }

        const selectedDayId = dateToDayId(date);
        if (!db.lists.data?.hasOwnProperty(selectedDayId)) {
            (async () => {
                await db.lists.create(date);
                setLoaded(true);
            })();
        } else {
            setLoaded(true);
        }
    }, [date]);

    const getList = (listId: Id): { success: boolean, list: ListRubric } => {
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

    const listsAsCollection = () => {
        const selectedDayId = dateToDayId(date);
        return {
            [selectedDayId]: {
                ...db.lists.data![selectedDayId],
                title: DAY_LIST_TITLE
            },
            [DO_LATER_LIST_ID]: db.lists.data![DO_LATER_LIST_ID]
        };
    }

    const createItem = (newItemConfig: ItemRubric, listId: Id): boolean => {
        let { success, list } = getList(listId);
        if (!success) return false;

        list.itemIds.push(newItemConfig.itemId);
        db.items.set(newItemConfig.itemId, newItemConfig);
        db.lists.set(listId, list);

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

        return true;
    };

    const deleteItem = (itemId: Id, listId: Id, index: number): boolean => {
        let { success, list } = getList(listId);
        if (!success) return false;

        // delete the item
        list.itemIds.splice(index, 1);
        db.items.del(itemId);
        db.lists.set(listId, list);

        return true;
    };

    const mutateLists = (sourceOfDrag: DraggableLocation, destinationOfDrag: DraggableLocation, draggableId: Id): boolean => {
        let { success: sourceSuccess, list: sourceList } = getList(sourceOfDrag.droppableId);
        let { success: destSuccess, list: destList } = getList(sourceOfDrag.droppableId);

        if (!sourceSuccess || !destSuccess) {
            return false;
        }

        sourceList.itemIds.splice(sourceOfDrag.index, 1);
        destList.itemIds.splice(destinationOfDrag.index, 0, draggableId);

        db.lists.set(sourceOfDrag.droppableId, sourceList);
        db.lists.set(destinationOfDrag.droppableId, destList);

        return true;
    };

    const log = () => {
        console.log("l", db.lists.data);
        console.log("i", db.items.data);
    }

    useHotkeys([
        ['P', log]
    ]);

    if (!loaded) {
        return <div></div>
    }

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
                    opened={opened}
                />
            }
            header={
                <Header height={{ base: headerHeight /* , md: 70 */ }} p="md">
                    <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                        <MediaQuery largerThan="sm" styles={{ display: 'none' }}>
                            <Burger
                                opened={opened}
                                onClick={() => setOpened((o) => !o)}
                                size="sm"
                                color="gray"
                                mr="xl"
                            />
                        </MediaQuery>
                        <Text ff="JetBrains Mono">StackBaker</Text>
                    </div>
                </Header>
            }
        >
            <ActionArea
                date={date}
                items={db.items.data!}
                lists={listsAsCollection()}
                createItem={createItem}
                mutateItem={mutateItem}
                deleteItem={deleteItem}
                mutateLists={mutateLists}
            />
        </AppShell>
    );
}

export default Dashboard;