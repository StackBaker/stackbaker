import dayjs from "dayjs";
import { useState } from "react";

interface PlannerProps {
    date: dayjs.Dayjs
};

const Planner = function(props: PlannerProps) {
    const [planningStage, setPlanningStage] = useState<(0 | 1 | 2 | 3)>(0);
    
    return <div>hi</div>
};

export default Planner;

