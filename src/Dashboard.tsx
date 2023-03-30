import { useState } from "react";
import { createStyles, AppShell, Navbar, Text, MediaQuery, Header, Burger, Group, Paper } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { DragDropContext } from "@hello-pangea/dnd";
import type { DropResult, DraggableLocation } from "@hello-pangea/dnd"
import { useHotkeys } from "@mantine/hooks";
import dayjs from "dayjs";

import List from "./List";
import DayCalendar from "./Calendars/DayCalendar";
import { DAY_LIST_ID, DO_LATER_LIST_ID, DAY_LIST_TITLE, DO_LATER_LIST_TITLE } from "./globals";
import type { Id } from "./globals";
import type { ItemCollection, ListCollection, LeftPanelProps, ActionAreaProps, DashboardProps } from "./DashboardTypes";
import type { ItemRubric } from "./Item";

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
                    value={props.date}
                    onChange={props.setDate}
                    size="xs"
                />
            </Navbar.Section>
            <Navbar.Section grow>{}</Navbar.Section>
            <Navbar.Section>TODO: local weather</Navbar.Section>
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

    return (
        <DragDropContext
            onDragEnd={onDragEnd}
        >
            <Group className={classes.actionArea} position="left" spacing="lg">
                <DayCalendar
                    height="85vh"
                    width="310px"
                    currentDay={dayjs().startOf("day")}
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
    const { classes } = useStyles();
    const actionAreaHeight = "95vh";
    const [date, setDate] = useState<Date | null>(new Date());
    const [opened, setOpened] = useState(false);
    
    // TODO: retrieve tasks for date from backend and remove this
    const [items, changeItems] = useState<ItemCollection>({});

    const [lists, changeLists] = useState<ListCollection>({
        [DAY_LIST_ID]: {
            listId: DAY_LIST_ID,
            title: DAY_LIST_TITLE,
            itemIds: []
        },
        [DO_LATER_LIST_ID]: {
            listId: DO_LATER_LIST_ID,
            title: DO_LATER_LIST_TITLE,
            itemIds: []
        }
    });

    const createItem = (newItemConfig: ItemRubric, listId: Id): boolean => {
        // validate?
        if (!lists.hasOwnProperty(listId)) {
            return false;
        }

        var newList = lists[listId];
        newList.itemIds.push(newItemConfig.itemId);
        changeItems({
            ...items,
            [newItemConfig.itemId]: newItemConfig
        });
        changeLists({
            ...lists,
            [listId]: newList
        });

        return true;
    };

    const mutateItem = (itemId: Id, newConfig: Partial<ItemRubric>): boolean => {
        if (!items.hasOwnProperty(itemId)) {
            return false;
        }

        var editedItem = {
            ...items[itemId],
            ...newConfig
        };

        changeItems({
            ...items,
            [itemId]: editedItem 
        });

        return true;
    };

    const deleteItem = (itemId: Id, listId: Id, index: number): boolean => {
        if (!items.hasOwnProperty(itemId) || !lists.hasOwnProperty(listId)) {
            return false;
        }

        // delete the id from the list
        var newList = lists[listId];
        newList.itemIds.splice(index, 1);

        // delete the item
        var newItems = structuredClone(items);
        delete newItems[itemId];

        changeLists({ ...lists, [listId]: newList });
        changeItems(newItems);

        return true;
    };

    const mutateLists = (sourceOfDrag: DraggableLocation, destinationOfDrag: DraggableLocation, draggableId: Id): boolean => {
        if (!lists.hasOwnProperty(sourceOfDrag.droppableId) || !lists.hasOwnProperty(destinationOfDrag.droppableId)) {
            return false;
        }

        var sourceList = lists[sourceOfDrag.droppableId];
        var destList = lists[destinationOfDrag.droppableId];

        sourceList.itemIds.splice(sourceOfDrag.index, 1);
        destList.itemIds.splice(destinationOfDrag.index, 0, draggableId);

        changeLists({
            ...lists,
            [sourceOfDrag.droppableId]: sourceList,
            [destinationOfDrag.droppableId]: destList
        });

        return true;
    };

    const log = () => {
        console.log("l", lists);
        console.log("i", items);
    }

    useHotkeys([
        ['P', log]
    ])

    // have to do this sx thing because AppShell automatically renders too large
    return (
        <AppShell
            sx={{ main: { minHeight: actionAreaHeight, maxHeight: actionAreaHeight }}}
            navbarOffsetBreakpoint="sm"
            navbar={
                <LeftPanel
                    date={date}
                    setDate={setDate}
                    opened={opened}
                />
            }
            header={
                <Header height={{ base: 50 /* , md: 70 */ }} p="md">
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
                items={items}
                lists={lists}
                createItem={createItem}
                mutateItem={mutateItem}
                deleteItem={deleteItem}
                mutateLists={mutateLists}
            />
        </AppShell>
    );
}

export default Dashboard;