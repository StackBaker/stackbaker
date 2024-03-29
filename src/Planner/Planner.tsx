import { useContext } from "react";
import dayjs from "dayjs";
import { useState, useMemo } from "react";
import { AppShell } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import { CoordinationContext } from "../coordinateBackendAndState";
import { LoadingStage, PlanningStage } from "../globals";
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

        if (coordination.loadStage !== LoadingStage.Ready) {
            return;
        }
        
        let result: boolean = coordination.addIncompleteAndLaterToToday();
        if (result) {
            handlers.close();
        }
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

