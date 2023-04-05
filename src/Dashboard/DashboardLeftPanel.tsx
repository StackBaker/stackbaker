import dayjs from "dayjs";
import { Navbar, Button, Space } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import SettingsIcon from '@mui/icons-material/Settings';
import useDatabase from "../Persistence/useDatabase";

interface SettingsProps {

};

const Settings = function(props: SettingsProps) {
    // TODO: maybe create a React context to know user information like email, etc
    
};

export interface DashLeftPanelProps {
    date: dayjs.Dayjs,
    setDate: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>
};

const DashboardLeftPanel = function(props: DashLeftPanelProps) {
    // TODO: remove this: this function shouldn't be using the database
    const db = useDatabase();

    return (
        <Navbar
            p="md"
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
                <Button fullWidth onClick={() => props.setDate(dayjs().startOf("day"))}>Today</Button>
            </Navbar.Section>
            <Navbar.Section grow>{}</Navbar.Section>
            <Navbar.Section>
                <Button
                    fullWidth
                    variant="default"
                    leftIcon={<SettingsIcon />}
                    onClick={() => {
                        db.events.clear();
                    }}
                >
                    Settings
                </Button>
            </Navbar.Section>
        </Navbar>
    );
};

export default DashboardLeftPanel;