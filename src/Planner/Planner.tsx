import { useContext } from "react";
import dayjs from "dayjs";
import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { ResponseType, fetch as tauriFetch } from "@tauri-apps/api/http";

import { CoordinationContext } from "../coordinateBackendAndState";
import { LoadingStage, PlanningStage, isDev } from "../globals";
import PlannerLeftPanel from "./PlannerLeftPanel";
import PlannerMain from "./PlannerMain";
import "../styles.css";

interface PlannerProps {
    date: dayjs.Dayjs,
    setDate: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>
};;

const Planner = function(props: PlannerProps) {
    const actionAreaHeight = "95vh";
    const [planningStage, setPlanningStage] = useState<PlanningStage>(PlanningStage.Record);

    const coordination = useContext(CoordinationContext);
    const [addIncAndLaterTasks, handlers] = useDisclosure(true);

    // add unfinished tasks from next day to today's items
    useMemo(() => {
        if (!addIncAndLaterTasks) {
            return;
        }

        if (coordination.loadStage !== LoadingStage.DBUpdated) {
            return;
        }
        
        let result: boolean = coordination.addIncompleteAndLaterToToday();
        if (result) {
            handlers.close();
        }
    }, [coordination.loadStage, addIncAndLaterTasks]);

    // add click counter to planner
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

        window.addEventListener("click", callback);
        return () => window.removeEventListener("click", callback);
    });
    
    return (
        <AppShell
            className="fade-in"
            sx={{
                main: {
                    minHeight: actionAreaHeight,
                    maxHeight: actionAreaHeight,
                }
            }}
            navbarOffsetBreakpoint="sm"
            navbar={
                (coordination.loadStage !== LoadingStage.Ready) ? <div></div> :
                <PlannerLeftPanel
                    date={props.date}
                    planningStage={planningStage}
                    setPlanningStage={setPlanningStage}
                />
            }
        >
            {
                (coordination.loadStage !== LoadingStage.Ready) ? <div></div> :
                <PlannerMain
                    date={props.date}                    
                    planningStage={planningStage}
                />
            }
        </AppShell>
    );
};

export default Planner;

