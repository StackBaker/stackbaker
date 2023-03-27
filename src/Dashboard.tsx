import { useState } from "react";
import { createStyles, MantineTheme, Divider } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import DayCalendar from "./DayCalendar";
import { Settings2 } from "tabler-icons-react";

const useStyles = createStyles((theme: MantineTheme) => {
    return ({
        wrapper: {
            display: "flex",
            flexDirection: "row",
            height: "97vh",
            width: "100%"
        },
        leftPanel: {
            display: "flex",
            flexDirection: "column",
            width: "20vw",
            padding: theme.spacing.sm
        },
        taskArea: {
            display: "flex",
            flexDirection: "row"
        }
    });
});

interface LeftPanelProps {
    date: Date | null,
    setDate: React.Dispatch<React.SetStateAction<Date | null>>
};

function LeftPanel(props: LeftPanelProps) {
    const { classes } = useStyles();

    return (
        <div className={classes.leftPanel}>
            <Settings2
                size={25}
                strokeWidth={1.5}
                color={'black'}
            />
            <DatePicker
                style={{ marginTop: "20px" }}
                value={props.date}
                onChange={props.setDate}
                size="xs"
            />
        </div>
    );
}

interface DashboardProps {

};

function Dashboard(props: DashboardProps | undefined) {
    const { classes } = useStyles();
    const [date, setDate] = useState<Date | null>(new Date());

    return (
        <div className={classes.wrapper}>
            <LeftPanel
                date={date}
                setDate={setDate}
            />
            <Divider
                size="xs"
                orientation="vertical"
                variant="solid"
            />
            <div className={classes.taskArea}>
                <DayCalendar />
            </div>
        </div>
    );
}

export default Dashboard;