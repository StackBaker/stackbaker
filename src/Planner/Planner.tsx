import dayjs from "dayjs";
import { useState } from "react";
import { AppShell } from "@mantine/core";

import type { planningStage } from "./plannerutils";
import coordinateBackendAndState from "../coordinateBackendAndState";
import type { coordinateBackendAndStateProps } from "../coordinateBackendAndState";
import PlannerLeftPanel from "./PlannerLeftPanel";
import PlannerMain from "./PlannerMain";
import "../styles.css";

type PlannerProps = coordinateBackendAndStateProps;

const Planner = function(props: PlannerProps) {
    // TODO: at the same time, search for unfinished tasks from the previous day
    // TODO: and actually store them in the listdb for the new day: CREATE A NEW ATOMIC useListDB function
    const actionAreaHeight = "95vh";
    const [planningStage, setPlanningStage] = useState<planningStage>(0);

    const coordination = coordinateBackendAndState(props);
    
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
                <PlannerLeftPanel
                    date={props.date}
                    planningStage={planningStage}
                    setPlanningStage={setPlanningStage}
                    mutateList={coordination.mutateList}
                />
            }
        >
            {
                (coordination.loadStage !== 2) ? <div></div>
                :
                <PlannerMain
                    date={coordination.date}
                    loadStage={coordination.loadStage}
                    planningStage={planningStage}
                    items={coordination.items}
                    lists={coordination.lists}
                    relevantListCollection={coordination.relevantListCollection}
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
};

export default Planner;

