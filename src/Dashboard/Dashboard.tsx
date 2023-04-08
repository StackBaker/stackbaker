import { AppShell, Text, Header, Button } from "@mantine/core";

import DashboardMain from "./DashboardMain";
import DashboardLeftPanel from "./DashboardLeftPanel";
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
                (coordination.loadStage !== 2) ? <div></div> :
                <DashboardLeftPanel
                    user={coordination.user}
                    date={props.date}
                    editUser={coordination.editUser}
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
                    user={coordination.user}
                    date={props.date}
                    items={coordination.items}
                    lists={coordination.relevantListCollection}
                    events={coordination.events}
                    createItem={coordination.createItem}
                    mutateItem={coordination.mutateItem}
                    deleteItem={coordination.deleteItem}
                    mutateLists={coordination.mutateLists}
                    saveEvent={coordination.saveEvent}
                    deleteEvent={coordination.deleteEvent}
                />
            }
            
        </AppShell>
    );
}

export default Dashboard;