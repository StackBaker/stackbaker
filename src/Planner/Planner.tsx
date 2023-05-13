import dayjs from "dayjs";
import { useState, useMemo } from "react";
import { AppShell } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import { planningStage } from "./plannerutils";
import coordinateBackendAndState from "../coordinateBackendAndState";
import { LOADING_STAGES } from "../globals";
import PlannerLeftPanel from "./PlannerLeftPanel";
import PlannerMain from "./PlannerMain";
import "../styles.css";
import { dateToDayId, getToday } from "../dateutils";
import { ListCollection } from "../List";

interface PlannerProps {
    date: dayjs.Dayjs,
    setDate: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>
};;

const Planner = function(props: PlannerProps) {
    const actionAreaHeight = "95vh";
    const [planningStage, setPlanningStage] = useState<planningStage>(0);

    const coordination = coordinateBackendAndState(props);
    const [addIncAndLaterTasks, handlers] = useDisclosure(true);

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
                />
            }
        >
            {
                (coordination.loadStage !== LOADING_STAGES.READY) ? <div></div> :
                <PlannerMain
                    user={coordination.user}
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
                    delManyItemsOrMutManyLists={coordination.delManyItemsOrMutManyLists}
                    saveEvent={coordination.saveEvent}
                    deleteEvent={coordination.deleteEvent}
                />
            }
        </AppShell>
    );
};

export default Planner;

