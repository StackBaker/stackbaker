import React, { useState, useEffect, useContext } from "react";
import { AppShell, Text, Header, Group, Button } from "@mantine/core";
import dayjs from "dayjs";
import { open } from "@tauri-apps/api/shell";
import { ResponseType, fetch as tauriFetch } from "@tauri-apps/api/http";

import DashboardMain from "./DashboardMain";
import DashboardLeftPanel from "./DashboardLeftPanel";
import CoordinationProvider, { CoordinationContext } from "../coordinateBackendAndState";
import { DashboardViewOption, LoadingStage, isDev } from "../globals";
import "../styles.css"


interface DashboardHeaderProps {
    headerHeight: number,
    setCurrentView: React.Dispatch<React.SetStateAction<DashboardViewOption>>
}

const DashboardHeader = function(props: DashboardHeaderProps) {
    const coordination = useContext(CoordinationContext);
    const feedbackLink = "https://airtable.com/shr2PFR5Urx9E1w8A"; // TODO: update this

    return (
        <Header height={{ base: props.headerHeight /* , md: 70 */ }} p="md">
            <div style={{ display: "flex", flexDirection: "row", height: "100%", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
                <Text className="dash-header">
                    {(coordination.loadStage === LoadingStage.Ready) ? "StackBaker" : "Loading..."}
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
                        onClick={() => props.setCurrentView(DashboardViewOption.Day)}
                    >
                        Day View
                    </Button>
                    <Button
                        variant="subtle"
                        onClick={() => props.setCurrentView(DashboardViewOption.Month)}
                    >
                        Month View
                    </Button>
                </div>
            </div>
        </Header>
    );
}


interface DashboardProps {
    date: dayjs.Dayjs,
    setDate: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>
};

const Dashboard = function(props: DashboardProps) {
    const actionAreaHeight = "95vh";
    const headerHeight = 50;

    const [currentView, setCurrentView] = useState<DashboardViewOption>(DashboardViewOption.Day);

    useEffect(() => {
        if (isDev()) {
            return;
        }

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
        window.addEventListener("click", callback);
        return () => window.removeEventListener("click", callback);
    });

    // have to do this sx thing because AppShell automatically renders too large
    return (
        <CoordinationProvider date={props.date} setDate={props.setDate}>
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
                    <DashboardHeader
                        headerHeight={headerHeight}
                        setCurrentView={setCurrentView}
                    />
                }
            >
                <DashboardMain
                    currentView={currentView}
                    date={props.date}
                    setDate={props.setDate}
                />
            </AppShell>
        </CoordinationProvider>
    );
}

export default Dashboard;