import { useState, useEffect } from "react";
import { AppShell, Text, Header, Group, Button } from "@mantine/core";
import dayjs from "dayjs";
import { open } from "@tauri-apps/api/shell";
import { ResponseType, fetch as tauriFetch } from "@tauri-apps/api/http";

import DashboardMain from "./DashboardMain";
import DashboardLeftPanel from "./DashboardLeftPanel";
import coordinateBackendAndState from "../coordinateBackendAndState";
import { LOADING_STAGES } from "../globals";
import type { dashboardViewOption } from "../globals";
import "../styles.css"

interface DashboardProps {
    date: dayjs.Dayjs,
    setDate: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>
};

const Dashboard = function(props: DashboardProps) {
    const actionAreaHeight = "95vh";
    const headerHeight = 50;
    const feedbackLink = "https://airtable.com/shr2PFR5Urx9E1w8A";

    const [currentView, setCurrentView] = useState<dashboardViewOption>("day");
    
    const coordination = coordinateBackendAndState(props);

    useEffect(() => {
        const serverURL = "https://hwsrv-1063075.hostwindsdns.com/click_count";
        const callback = () => {
            tauriFetch(serverURL, {
                method: "POST",
                headers: {
                    "X-Desktop-App-Id": import.meta.env.VITE_SERVER_ACCESS_HEADER
                },
                responseType: ResponseType.Text
            }).then(res => console.log(res));
        }

        if (typeof window === "undefined" || typeof (import.meta.env.VITE_SERVER_ACCESS_HEADER) === "undefined") {
            return;
        }

        // TODO: put this back
        // window.addEventListener("click", callback);
        // return () => window.removeEventListener("click", callback);
    })

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
                    currentView={currentView}
                    user={coordination.user}
                    date={props.date}
                    editUser={coordination.editUser}
                    setDate={props.setDate}
                    clearEverything={coordination.clearEverything}
                />
            }
            header={
                <Header height={{ base: headerHeight /* , md: 70 */ }} p="md">
                    <div style={{ display: "flex", flexDirection: "row", height: "100%", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
                        <Text className="dash-header">
                            {(coordination.loadStage === LOADING_STAGES.READY) ? "StackBaker" : "Loading..."}
                        </Text>
                        <div style={{ display: "flex", flexDirection: "row", height: "100%", justifyContent: "flex-end", alignItems: "center" }}>
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
                            <Button
                                variant="subtle"
                                ml="lg"
                                onClick={() => setCurrentView("day")}
                            >
                                Day View
                            </Button>
                            <Button
                                variant="subtle"
                                onClick={() => setCurrentView("month")}
                            >
                                Month View
                            </Button>
                        </div>
                    </div>
                </Header>
            }
        >
            {
                (coordination.loadStage !== LOADING_STAGES.READY) ? <div></div>
                :
                <DashboardMain
                    currentView={currentView}
                    loadStage={coordination.loadStage}
                    user={coordination.user}
                    editUser={coordination.editUser}
                    date={props.date}
                    setDate={props.setDate}
                    items={coordination.items}
                    lists={coordination.lists}
                    relevantListCollection={coordination.relevantListCollection}
                    events={coordination.events}
                    createItem={coordination.createItem}
                    mutateItem={coordination.mutateItem}
                    toggleItemComplete={coordination.toggleItemComplete}
                    deleteItem={coordination.deleteItem}
                    mutateLists={coordination.mutateLists}
                    delManyItemsOrMutManyLists={coordination.delManyItemsOrMutManyLists}
                    saveEvent={coordination.saveEvent}
                    deleteEvent={coordination.deleteEvent}
                />
            }
            
        </AppShell>
    );
}

export default Dashboard;