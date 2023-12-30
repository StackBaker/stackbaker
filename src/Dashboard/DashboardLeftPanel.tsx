import { useState, useEffect, useContext } from "react";
import dayjs from "dayjs";
import { Modal, Group, Stack, Navbar, Button, Space, TextInput, Text, Title, Select, Kbd } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import SettingsIcon from '@mui/icons-material/Settings';
import DangerousIcon from '@mui/icons-material/Dangerous';
import CloseIcon from '@mui/icons-material/Close';
import { useDisclosure } from "@mantine/hooks";
import { useNavigate } from "react-router-dom";
import { Google } from "@mui/icons-material";
import { invoke } from "@tauri-apps/api";
import { open } from "@tauri-apps/api/shell";

import { getToday } from "../dateutils";
import "../styles.css";
import type { UserRubric } from "../Persistence/useUserDB";
import { LOGIN_PATH, ROOT_PATH } from "../paths";
import { LoadingStage } from "../globals";
import { CoordinationContext } from "../coordinateBackendAndState";

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
    date: dayjs.Dayjs,
    setDate: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>
};

const DashboardLeftPanel = function(props: DashLeftPanelProps) {
    const navigate = useNavigate();
	const [oauthURL, setOAuthUrl] = useState("");
    const [settingsOpen, handlers] = useDisclosure(false);
    const [confirmOpen, confirmHandlers] = useDisclosure(false);
    const [accountBeingEdited, setAccountBeingEdited] = useState<{ [k in keyof UserRubric]: string }>();

    const coordination = useContext(CoordinationContext);

    useEffect(() => {
        if (!coordination.user)
            return;
        
        // is there a more programmatic way of doing this?
        const stringifiedAcc = Object.keys(coordination.user).reduce((prev, _cur) => {
            let cur = _cur as (keyof UserRubric);
            return {
                ...prev,
                [cur]: JSON.stringify(coordination.user[cur])
            }
        }, {} as { [k in keyof UserRubric]: string });

        setAccountBeingEdited(stringifiedAcc);
    }, [coordination.user]);

	useEffect(() => {
		invoke("create_oauth_request_url").then((r) => {
			let res = r as string;
			setOAuthUrl(res);
			console.log("Auth URL:", res);
		});
	}, []);

    const handleSubmitSettings = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();
        let newHours: number = parseInt(accountBeingEdited!.hoursInDay);
        if (isNaN(newHours)) {
            newHours = coordination.user.hoursInDay;
        }
        
        let newEvtLen: number = parseInt(accountBeingEdited!.defaultEventLength);
        if (isNaN(newEvtLen)) {
            newEvtLen = coordination.user.defaultEventLength;
        }
        
        newHours = Math.max(24, Math.min(newHours, 120));
        newEvtLen = Math.ceil(Math.max(1, Math.min(newEvtLen, 300)) / 5) * 5;

        let newDayCalInterval: number = parseInt(accountBeingEdited!.dayCalLabelInterval);
        if (isNaN(newDayCalInterval)) {
            newDayCalInterval = coordination.user.dayCalLabelInterval;
        }
        
        let newDayCalSnapDuration: number = parseInt(accountBeingEdited!.dayCalSnapDuration);
        if (isNaN(newDayCalInterval)) {
            newDayCalSnapDuration = coordination.user.dayCalSnapDuration;
        }

        let newautoLoadPlanner: boolean = (accountBeingEdited!.autoLoadPlanner === "false") ? false : true;

        coordination.editUser({
            defaultEventLength: newEvtLen,
            hoursInDay: newHours,
            dayCalLabelInterval: newDayCalInterval,
            dayCalSnapDuration: newDayCalSnapDuration,
            autoLoadPlanner: newautoLoadPlanner
        });
    }

    const confirmDeleteEverything = () => {
        confirmHandlers.close();
        coordination.clearEverything();
        navigate(ROOT_PATH);
    }

    const confirmCancel = () => {
        confirmHandlers.close();
    }

    return (
        (coordination.loadStage !== LoadingStage.Ready) ? <div></div> :
        <Navbar
            p="md"
            className="fade-in"
            hiddenBreakpoint="sm"
            hidden={false}
            width={{ sm: 250, lg: 250 }}
            sx={(settingsOpen) ? { overflow: "scroll" } : {}}
        >
            <Navbar.Section pb="xs">
                <ConfirmModal
                    opened={confirmOpen}
                    confirm={confirmDeleteEverything}
                    cancel={confirmCancel}
                />
                { (settingsOpen) ? 
                    <Stack spacing="md">
                        <Title order={2}>Settings</Title>
                        {/* <Button
                            leftIcon={<Google />}
                            disabled={props.user.authData !== null}
                            onClick={() => {
                                if (props.user.authData === null) {
                                    open(oauthURL);
                                    navigate(LOGIN_PATH);
                                }
                            }}
                        >
                            Connect Google
                        </Button> */}
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
                            description="Default duration in minutes of events created by drag and drop into the day calendar, a multiple of 5"
                            placeholder="5 ≤ input ≤ 300"
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
                        <Select
                            label="Day calendar snap duration"
                            description="Precision with which to snap events to the day calendar"
                            placeholder="5 or 15 min"
                            value={accountBeingEdited!.dayCalSnapDuration}
                            onChange={(newVal: string | null) => {
                                if (!newVal)
                                    return;
                                setAccountBeingEdited({
                                    ...accountBeingEdited!,
                                    dayCalSnapDuration: newVal
                                })
                            }}
                            data={[
                                { value: "5", label: "5 min" },
                                { value: "15", label: "15 min" }
                            ]}
                        />
                        <Select
                            label="Auto-load the planner"
                            description="Whether or not to automatically load the planner on opening StackBaker at the beginning of each day"
                            placeholder="Yes or no"
                            value={accountBeingEdited!.autoLoadPlanner}
                            onChange={(newVal: string | null) => {
                                if (!newVal)
                                    return;
                                setAccountBeingEdited({
                                    ...accountBeingEdited!,
                                    autoLoadPlanner: newVal
                                });
                            }}
                            data={[
                                { value: "true", label: "Yes" },
                                { value: "false", label: "No" }
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
                            renderDay={(date) => {
                                // highlight today if it is not selected
                                const day = dayjs(date);
                                return (
                                    <div
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            borderRadius: "5px",
                                            backgroundColor: (dayjs().isSame(day, "day") && !props.date.isSame(dayjs(), "day")) ? "rgba(255, 0, 0, 0.2)" : "none"
                                        }}
                                    >
                                        {date.getDate()}
                                    </div>
                                );
                            }}
                        />
                        <Space h="lg"></Space>
                        <Button fullWidth onClick={() => props.setDate(getToday())}>Today</Button>
                        <Space h="sm"></Space>
                        <Text
                            size="sm"
                            px="lg"
                            weight={700}
                            align="center"
                            sx={{
                                opacity: 0,
                                transition: "0.1s",
                                "&:hover": {
                                    opacity: 1,
                                    transition: "all 0.5s"
                                }
                            }}
                        >
                            Pro Tip: Create new items using <Kbd>N</Kbd> and <Kbd>L</Kbd>
                        </Text>
                    </>
                }
            </Navbar.Section>
            <Navbar.Section grow><></></Navbar.Section>
            <Navbar.Section>
                {
                    (settingsOpen) ?
                    <Button
                        fullWidth
                        variant="outline"
                        onClick={() => coordination.editUser(null)}
                    >
                        Reset to defaults
                    </Button>
                    : null
                }
                <Space h="lg"></Space>
                <Button
                    fullWidth
                    variant="default"
                    leftIcon={(settingsOpen) ? <CloseIcon/> : <SettingsIcon />}
                    onClick={handlers.toggle}
                >
                    {(settingsOpen) ? "Close Settings" : "Settings"}
                </Button>
                <Space h="lg"></Space>
                {
                    (settingsOpen) ?
                    <Button
                        fullWidth
                        variant="outline"
                        color="red"
                        leftIcon={<DangerousIcon />}
                        onClick={() => confirmHandlers.open()}
                    >
                        Clear data
                    </Button>
                    : null
                }
            </Navbar.Section>
        </Navbar>
    );
};

export default DashboardLeftPanel;