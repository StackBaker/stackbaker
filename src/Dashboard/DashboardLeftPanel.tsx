import dayjs from "dayjs";
import { Navbar, Button, Space } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import SettingsIcon from '@mui/icons-material/Settings';

import { getToday } from "../dateutils";
import "../styles.css";

interface SettingsProps {

};

const Settings = function(props: SettingsProps) {

    
};

export interface DashLeftPanelProps {
    date: dayjs.Dayjs,
    setDate: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>
};

const DashboardLeftPanel = function(props: DashLeftPanelProps) {

    return (
        <Navbar
            p="md"
            className="fade-in"
            hiddenBreakpoint="sm"
            hidden={false}
            width={{ sm: 250, lg: 250 }}
        >
            <Navbar.Section>
                <DatePicker
                    defaultDate={props.date.toDate()}
                    value={props.date.toDate()}
                    onChange={(v) => props.setDate(dayjs(v))}
                    size="xs"
                />
                <Space h="lg"></Space>
                <Button fullWidth onClick={() => props.setDate(getToday())}>Today</Button>
            </Navbar.Section>
            <Navbar.Section grow>{}</Navbar.Section>
            <Navbar.Section>
                <Button
                    fullWidth
                    variant="default"
                    leftIcon={<SettingsIcon />}
                    onClick={() => {}}
                >
                    Settings
                </Button>
            </Navbar.Section>
        </Navbar>
    );
};

export default DashboardLeftPanel;