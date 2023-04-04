import React, { useMemo, useState } from "react";
import { AppShell, Text, Header } from "@mantine/core";
import { useHotkeys } from "@mantine/hooks";
import type { DraggableLocation } from "@hello-pangea/dnd";
import dayjs from "dayjs";

import { Id } from "../globals";
import DashboardMain from "./DashboardMain";
import DashboardLeftPanel from "./DashboardLeftPanel";
import type { ItemRubric } from "../Item";
import type { ListRubric, ListCollection } from "../List";
import useDatabase from "../Persistence/useDatabase";
import { dateToDayId } from "../dateutils";
import { DO_LATER_LIST_ID } from "../globals";
import coordinateBackendAndState from "../coordinateBackendAndState";
import type { coordinateBackendAndStateProps } from "../coordinateBackendAndState";

type DashboardProps = coordinateBackendAndStateProps;

const Dashboard = function(props: DashboardProps) {
    const actionAreaHeight = "95vh";
    const headerHeight = 50;
    
    const coordination = coordinateBackendAndState(props);

    // have to do this sx thing because AppShell automatically renders too large
    return (
        <AppShell
            sx={{
                main: {
                    minHeight: actionAreaHeight,
                    maxHeight: actionAreaHeight,
                    paddingTop: headerHeight
                }
            }}
            navbarOffsetBreakpoint="sm"
            navbar={
                <DashboardLeftPanel
                    date={props.date}
                    setDate={props.setDate}
                />
            }
            header={
                <Header height={{ base: headerHeight /* , md: 70 */ }} p="md">
                    <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                        <Text ff="JetBrains Mono">
                            {(coordination.loadStage === 2) ? "StackBaker" : "Loading..."}
                        </Text>
                    </div>
                </Header>
            }
        >
            {
                (coordination.loadStage !== 2) ? <div></div>
                :
                <DashboardMain
                    date={props.date}
                    items={coordination.items}
                    lists={coordination.lists}
                    createItem={coordination.createItem}
                    mutateItem={coordination.mutateItem}
                    deleteItem={coordination.deleteItem}
                    mutateLists={coordination.mutateLists}
                />
            }
            
        </AppShell>
    );
}

export default Dashboard;