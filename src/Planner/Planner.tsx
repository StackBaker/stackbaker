import dayjs from "dayjs";
import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { ResponseType, fetch as tauriFetch } from "@tauri-apps/api/http";

import { planningStage } from "./plannerutils";
import coordinateBackendAndState from "../coordinateBackendAndState";
import { DO_LATER_LIST_ID, LOADING_STAGES } from "../globals";
import PlannerLeftPanel from "./PlannerLeftPanel";
import PlannerMain from "./PlannerMain";
import "../styles.css";

interface PlannerProps {
    date: dayjs.Dayjs,
    setDate: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>
};;

const Planner = function(props: PlannerProps) {
    // TODO: skip stage 3 if there are no later tasks
    const actionAreaHeight = "95vh";
    const [planningStage, setPlanningStage] = useState<planningStage>(0);

    const coordination = coordinateBackendAndState(props);
    const [addIncAndLaterTasks, handlers] = useDisclosure(true);

    // add click counter to planner
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
        window.addEventListener("click", callback);
        return () => window.removeEventListener("click", callback);
    });

    // TODO: test the bug fixes and push a new release

    // add unfinished tasks from next day to today's items
    useMemo(() => {
        if (!addIncAndLaterTasks)
            return;

        if (coordination.loadStage !== LOADING_STAGES.DB_UPDATED)
            return;
        
        let result: boolean = coordination.addIncompleteAndLaterToToday();
        if (result)
            handlers.close();
    }, [coordination.loadStage, addIncAndLaterTasks]);
    
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
                (coordination.loadStage !== LOADING_STAGES.READY) ? <div></div> :
                <PlannerLeftPanel
                    date={props.date}
                    planningStage={planningStage}
                    setPlanningStage={setPlanningStage}
                    mutateList={coordination.mutateList}
                    numLaterTasks={coordination.lists![DO_LATER_LIST_ID].itemIds.length}
                />
            }
        >
            {
                (coordination.loadStage !== LOADING_STAGES.READY) ? <div></div> :
                <PlannerMain
                    user={coordination.user}
                    editUser={coordination.editUser}
                    date={coordination.date}
                    loadStage={coordination.loadStage}
                    planningStage={planningStage}
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
};

export default Planner;

