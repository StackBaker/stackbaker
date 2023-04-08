import { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import { Stack, Navbar, Button, Space, TextInput, Title } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import SettingsIcon from '@mui/icons-material/Settings';
import { useDisclosure } from "@mantine/hooks";
import { getHotkeyHandler } from "@mantine/hooks";
import { useForm } from "@mantine/form";

import { getToday } from "../dateutils";
import "../styles.css";
import type { UserRubric } from "../Persistence/useUserDB";

export interface DashLeftPanelProps {
    user: UserRubric,
    date: dayjs.Dayjs,
    editUser: (newUserConfig: Partial<UserRubric> | null) => boolean,
    setDate: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>
};

const DashboardLeftPanel = function(props: DashLeftPanelProps) {
    const [settingsOpen, handlers] = useDisclosure(false);
    const [accountBeingEdited, setAccountBeingEdited] = useState<{ [k in keyof UserRubric]: string }>();

    useEffect(() => {
        if (!props.user)
            return;
        
        setAccountBeingEdited({
            email: props.user.email,
            hoursInDay: JSON.stringify(props.user.hoursInDay),
            defaultEventLength: JSON.stringify(props.user.defaultEventLength)
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
        
        newHours = Math.max(24, Math.min(newHours, 120));
        newEvtLen = Math.max(1, Math.min(newEvtLen, 300));

        console.log(newHours, newEvtLen);

        props.editUser({ defaultEventLength: newEvtLen, hoursInDay: newHours, });
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
                        <Button onClick={handleSubmitSettings} fullWidth>Save</Button>
                    </Stack>
                    :
                    <>
                        <DatePicker
                            defaultDate={props.date.toDate()}
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
                    <Button
                        fullWidth
                        variant="outline"
                        onClick={() => props.editUser(null)}
                    >
                        Reset to defaults
                    </Button>
                    : null
                }
                <Space h="lg"></Space>
                <Button
                    fullWidth
                    variant="default"
                    leftIcon={<SettingsIcon />}
                    onClick={handlers.toggle}
                >
                    {(settingsOpen) ? "Close" : "Settings"}
                </Button>
            </Navbar.Section>
        </Navbar>
    );
};

export default DashboardLeftPanel;