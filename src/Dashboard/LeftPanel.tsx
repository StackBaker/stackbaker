import dayjs from "dayjs";
import { Drawer, Navbar, Button, Space } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import SettingsIcon from '@mui/icons-material/Settings';
import useDatabase from "../Persistence/useDatabase";

interface SettingsProps {

};

const Settings = function(props: SettingsProps) {
    // TODO: maybe create a React context to know user information like email, etc
    
};

export interface LeftPanelProps {
    date: dayjs.Dayjs,
    setDate: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>
};

const LeftPanel = function(props: LeftPanelProps) {
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
            <Navbar.Section>TODO: local weather:maybe WeatherKit?</Navbar.Section>
            <Navbar.Section>
                <Button
                    fullWidth
                    variant="default"
                    leftIcon={<SettingsIcon />}
                    onClick={() => { 
                        db.items.clear();
                        db.lists.clear();
                    }}
                >
                    Settings
                </Button>
            </Navbar.Section>
        </Navbar>
    );
};

export default LeftPanel;