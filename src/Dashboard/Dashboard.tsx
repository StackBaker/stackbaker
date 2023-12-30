import React, { useState, useEffect, useContext } from "react";
import { AppShell, Text, Header, Button } from "@mantine/core";
import dayjs from "dayjs";
import { ResponseType, fetch as tauriFetch } from "@tauri-apps/api/http";

import DashboardMain from "./DashboardMain";
import DashboardLeftPanel from "./DashboardLeftPanel";
import { CoordinationContext } from "../coordinateBackendAndState";
import { DashboardViewOption, LoadingStage, isDev } from "../globals";
import "../styles.css"


interface DashboardHeaderProps {
    headerHeight: number,
    setCurrentView: React.Dispatch<React.SetStateAction<DashboardViewOption>>
}

const DashboardHeader = function(props: DashboardHeaderProps) {
    const coordination = useContext(CoordinationContext);

    return (
        <Header height={{ base: props.headerHeight /* , md: 70 */ }} p="md">
            <div style={{ display: "flex", flexDirection: "row", height: "100%", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
                <Text className="dash-header">
                    {(coordination.loadStage === LoadingStage.Ready) ? "StackBaker" : "Loading..."}
                </Text>
                <div style={{ display: "flex", flexDirection: "row", height: "100%", justifyContent: "flex-end", alignItems: "center" }}>
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
    );
}

export default Dashboard;