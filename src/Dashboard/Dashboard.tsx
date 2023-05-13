import { AppShell, Text, Header, Group } from "@mantine/core";
import dayjs from "dayjs";
import { open } from "@tauri-apps/api/shell";

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
    const feedbackLink = "https://airtable.com/shr2PFR5Urx9E1w8A";
    
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
                    <Group h="100%" position="apart">
                        <Text className="dash-header">
                            {(coordination.loadStage === LOADING_STAGES.READY) ? "StackBaker" : "Loading..."}
                        </Text>
                        <Text
                            onClick={() => open(feedbackLink).then() }
                            className="dash-header"
                            size={10}
                            underline
                            c="#2008f4"
                            sx={{ cursor: "pointer" }}
                        >
                            Find any bugs or have any feedback?
                        </Text>
                    </Group>
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