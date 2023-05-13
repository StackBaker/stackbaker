import { AppShell, Text, Header } from "@mantine/core";
import dayjs from "dayjs";

import DashboardMain from "./DashboardMain";
import DashboardLeftPanel from "./DashboardLeftPanel";
import coordinateBackendAndState from "../coordinateBackendAndState";
import { LOADING_STAGES } from "../globals";
import "../styles.css"

interface DashboardProps {
    date: dayjs.Dayjs,
    setDate: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>
};

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
                (coordination.loadStage !== LOADING_STAGES.READY) ? <div></div> :
                <DashboardLeftPanel
                    user={coordination.user}
                    date={props.date}
                    editUser={coordination.editUser}
                    setDate={props.setDate}
                    clearEverything={coordination.clearEverything}
                />
            }
            header={
                <Header height={{ base: headerHeight /* , md: 70 */ }} p="md">
                    <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                        <Text className="dash-header">
                            {(coordination.loadStage === LOADING_STAGES.READY) ? "StackBaker" : "Loading..."}
                        </Text>
                    </div>
                </Header>
            }
        >
            {
                (coordination.loadStage !== LOADING_STAGES.READY) ? <div></div>
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