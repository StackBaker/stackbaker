import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Modal, Group, Stack, Navbar, Button, Space, TextInput, Text, Title, Select } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import SettingsIcon from '@mui/icons-material/Settings';
import DangerousIcon from '@mui/icons-material/Dangerous';
import CloseIcon from '@mui/icons-material/Close';
import { useDisclosure } from "@mantine/hooks";
import { useNavigate } from "react-router-dom";

import { getToday } from "../dateutils";
import "../styles.css";
import type { UserRubric } from "../Persistence/useUserDB";
import { ROOT_PATH } from "../paths";
import type { dashboardViewOption } from "../globals";

interface ConfirmModalProps {
    opened: boolean,
    confirm: () => void
    cancel: () => void
};

const ConfirmModal = (props: ConfirmModalProps) => {
    return (
        <Modal
            opened={props.opened}
            title={<Text>Confirm deletion</Text>}
            onClose={props.cancel}
            centered
        >
            <Stack spacing="xl">
                <Text pl="xs">Are you sure you want to delete all app data?</Text>
                <Space h="md" />
                <Group position="apart">
                    <Button onClick={props.cancel}>Cancel</Button>
                    <Button variant="outline" color="red" onClick={props.confirm}>Confirm</Button>
                </Group>
            </Stack>
        </Modal>
    );
}


export interface DashLeftPanelProps {
    currentView: dashboardViewOption,
    user: UserRubric,
    date: dayjs.Dayjs,
    editUser: (newUserConfig: Partial<UserRubric> | null) => boolean,
    setDate: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>,
    clearEverything: () => void,
};

const DashboardLeftPanel = function(props: DashLeftPanelProps) {
    const navigate = useNavigate();
    const [settingsOpen, handlers] = useDisclosure(false);
    const [confirmOpen, confirmHandlers] = useDisclosure(false);
    const [accountBeingEdited, setAccountBeingEdited] = useState<{ [k in keyof UserRubric]: string }>();

    useEffect(() => {
        if (!props.user)
            return;
        
        setAccountBeingEdited({
            email: props.user.email,
            hoursInDay: JSON.stringify(props.user.hoursInDay),
            defaultEventLength: JSON.stringify(props.user.defaultEventLength),
            dayCalLabelInterval: JSON.stringify(props.user.dayCalLabelInterval)
        });
    }, [props.user]);

    const handleSubmitSettings = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();
        let newHours: number = parseInt(accountBeingEdited!.hoursInDay);
        if (isNaN(newHours))
            newHours = props.user.hoursInDay;
        
        let newEvtLen: number = parseInt(accountBeingEdited!.defaultEventLength);
        if (isNaN(newEvtLen))
            newEvtLen = props.user.defaultEventLength;
        
        let newDayCalInterval: number = parseInt(accountBeingEdited!.dayCalLabelInterval);
        if (isNaN(newDayCalInterval))
            newDayCalInterval = props.user.dayCalLabelInterval;
        
        newHours = Math.max(24, Math.min(newHours, 120));
        newEvtLen = Math.max(1, Math.min(newEvtLen, 300));

        props.editUser({ defaultEventLength: newEvtLen, hoursInDay: newHours, dayCalLabelInterval: newDayCalInterval });
    }

    const confirmDeleteEverything = () => {
        confirmHandlers.close();
        props.clearEverything();
        navigate(ROOT_PATH);
    }

    const confirmCancel = () => {
        confirmHandlers.close();
    }

    return (
        <Navbar
            p="md"
            className="fade-in"
            hiddenBreakpoint="sm"
            hidden={false}
            width={{ sm: 250, lg: 250 }}
        >
            <Navbar.Section>
                <ConfirmModal
                    opened={confirmOpen}
                    confirm={confirmDeleteEverything}
                    cancel={confirmCancel}
                />
                { (settingsOpen) ? 
                    <Stack spacing="md">
                        <Title order={2}>Settings</Title>
                        <TextInput
                            label="Hours in a day"
                            description="How long the day calendar column is in hours"
                            placeholder="24 ≤ input ≤ 120"
                            value={accountBeingEdited!.hoursInDay}
                            onChange={(e) => (setAccountBeingEdited({
                                ...accountBeingEdited!,
                                hoursInDay: e.target.value
                            }))}
                        />
                        <TextInput
                            label="Default event length"
                            description="Default duration in minutes of events created by drag and drop from lists into day calendar"
                            placeholder="0 < input ≤ 300"
                            value={accountBeingEdited!.defaultEventLength}
                            onChange={(e) => (setAccountBeingEdited({
                                ...accountBeingEdited!,
                                defaultEventLength: e.target.value
                            }))}
                        />
                        <Select
                            label="Day calendar labeling interval"
                            description="Duration between consecutive labels in the day calendar"
                            placeholder="30 min, 1 hour, or 2 hours"
                            value={accountBeingEdited!.dayCalLabelInterval}
                            onChange={(newVal: string | null) => {
                                if (!newVal)
                                    return;
                                setAccountBeingEdited({
                                    ...accountBeingEdited!,
                                    dayCalLabelInterval: newVal
                                });
                            }}
                            data={[
                                { value: "30", label: "30 min" },
                                { value: "60", label: "1 hour" },
                                { value: "120", label: "2 hours" }
                            ]}
                        />
                        <Button onClick={handleSubmitSettings} fullWidth>Save</Button>
                    </Stack>
                    :
                    <>
                        <DatePicker
                            defaultDate={props.date.toDate()}
                            firstDayOfWeek={0}
                            value={props.date.toDate()}
                            onChange={(v) => props.setDate(dayjs(v))}
                            size="xs"
                        />
                        <Space h="lg"></Space>
                        <Button fullWidth onClick={() => props.setDate(getToday())}>Today</Button>
                    </>
                }
            </Navbar.Section>
            <Navbar.Section grow>{}</Navbar.Section>
            <Navbar.Section>
                {
                    (settingsOpen) ?
                    <Stack>
                        <Button
                            fullWidth
                            variant="outline"
                            onClick={() => props.editUser(null)}
                        >
                            Reset to defaults
                        </Button>
                        <Button
                            fullWidth
                            variant="outline"
                            color="red"
                            leftIcon={<DangerousIcon />}
                            onClick={() => confirmHandlers.open()}
                        >
                            Clear data
                        </Button>
                    </Stack>
                    : null
                }
                <Space h="lg"></Space>
                <Button
                    fullWidth
                    variant="default"
                    leftIcon={(settingsOpen) ? <CloseIcon/> : <SettingsIcon />}
                    onClick={handlers.toggle}
                >
                    {(settingsOpen) ? "Close" : "Settings"}
                </Button>
            </Navbar.Section>
        </Navbar>
    );
};

export default DashboardLeftPanel;