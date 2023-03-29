import { useState } from "react";
import { createStyles, AppShell, Navbar, Text, MediaQuery, Header, Burger, Group, Paper } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { v4 as uuid } from "uuid";
import { DragDropContext } from "@hello-pangea/dnd";
import type { DropResult, DraggableLocation } from "@hello-pangea/dnd"

import List from "./List";
import { DAY_LIST_ID, DO_LATER_LIST_ID, DAY_TASK_LIST_TITLE, DO_LATER_TASK_LIST_TITLE } from "./globals";
import type { Id } from "./globals";
import type { ItemCollection, ListCollection, LeftPanelProps, ActionAreaProps, DashboardProps } from "./DashboardTypes";
import type { ItemRubric } from "./Item";

const useStyles = createStyles((theme) => ({
    wrapper: {},
    leftPanel: {},
    taskArea: {}
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

    const onDragEnd = function(result: DropResult) {
        const { source, destination, draggableId } = result;

        if (!destination || (source.droppableId === destination.droppableId &&
            source.index === destination.index)) {
            return;
        }

        props.mutateLists(source, destination, draggableId);
    }


    return (
        <DragDropContext
            onDragEnd={onDragEnd}
        >
            <Group className={classes.taskArea} position="left">
                {Object.keys(props.lists).map(tlid => {
                    return (
                        <List
                            key={tlid}
                            items={props.items}
                            mutateItem={props.mutateItem}
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
    const [date, setDate] = useState<Date | null>(new Date());
    const [opened, setOpened] = useState(false);
    
    // TODO: retrieve tasks for date from backend and remove this
    const dummyItemId = uuid();
    const dummyItemId2 = uuid();
    const [items, changeItems] = useState<ItemCollection>({
        [dummyItemId]: {
            itemId: dummyItemId,
            content: "Get started with StackBaker!",
            complete: false
        },
        [dummyItemId2]: {
            itemId: dummyItemId2,
            content: "Bruh",
            complete: false
        }
    });

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

    const [lists, changeLists] = useState<ListCollection>({
        [DAY_LIST_ID]: {
            listId: DAY_LIST_ID,
            title: DAY_TASK_LIST_TITLE,
            itemIds: [dummyItemId]
        },
        [DO_LATER_LIST_ID]: {
            listId: DO_LATER_LIST_ID,
            title: DO_LATER_TASK_LIST_TITLE,
            itemIds: [dummyItemId2]
        }
    });

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
    }

    // have to do this sx thing because AppShell automatically renders too large
    return (
        <AppShell
            sx={{ main: { minHeight: "95vh", maxHeight: "95vh" }}}
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
                mutateLists={mutateLists}
                mutateItem={mutateItem}
            />
        </AppShell>
    );
}

export default Dashboard;