import { useContext } from "react";
import dayjs from "dayjs";
import { Navbar, Space, Title, Text, Stack, Group, Button } from "@mantine/core";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import { useNavigate } from "react-router-dom";

import { DASHBOARD_PATH } from "../paths";
import { PlanningStage, PlanningStageStrings } from "../globals";
import type { ListRubric } from "../List";
import type { Id } from "../globals";
import { dateToDayId, getToday } from "../dateutils";
import { CoordinationContext } from "../coordinateBackendAndState";

interface PlannerLeftPanelProps {
    date: dayjs.Dayjs,
    planningStage: PlanningStage,
    setPlanningStage: React.Dispatch<React.SetStateAction<PlanningStage>>,
};

const PlannerLeftPanel = function(props: PlannerLeftPanelProps) {
    const navigate = useNavigate();
    const { mutateList } = useContext(CoordinationContext);

    const titles: PlanningStageStrings = {
        [PlanningStage.Record]: "What do you want to get done today?",
        [PlanningStage.Estimate]: "Make a plan.",
        [PlanningStage.PlanAhead]: "Plan to deal with what you can't get to today.",
        [PlanningStage.Timebox]: "Finalize your day."
    };

    const tidbits: PlanningStageStrings = {
        [PlanningStage.Record]: "Don't worry about when or how – we'll go through that later.\
            Simply, empty your mind.",
        [PlanningStage.Estimate]: "Plan your day. If something can't fit in your schedule, drag it into the Later list. Or maybe, something you saved for later can fit in your schedule today.",
        [PlanningStage.PlanAhead]: "Drag and drop items from your Later list into the days you know \
            you'll be able to deal with them.",
        [PlanningStage.Timebox]: "Review your plan, and get ready for the day."
    };

    return (
        <Navbar
            p="md"
            hidden={false}
            width={{ sm: 250, lg: "25vw" }}
            withBorder
        >
            <Space h={100}></Space>
            <Navbar.Section>
                <Stack align="left" px={35}>
                    <Title order={2} align="left">{titles[props.planningStage]}</Title>
                    <Text>{tidbits[props.planningStage]}</Text>
                </Stack>
            </Navbar.Section>
            <Navbar.Section grow><></></Navbar.Section>
            <Navbar.Section>
                <Group position="apart" p={35}>
                    {
                        (props.planningStage !== PlanningStage.Record) ?
                        <Button
                            onClick={() => {
                                props.setPlanningStage(props.planningStage - 1);
                            }}
                            leftIcon={<NavigateBeforeIcon />}
                            variant="default"
                        >
                            Back
                        </Button>
                        :
                        <Button
                            onClick={() => {
                                // only set today to planned
                                if (getToday().isSame(props.date, "day")) {
                                    const id = dateToDayId(props.date);
                                    // .then() without a callback properly waits for this to finish
                                    mutateList(id, { planned: true }).then();
                                }
                                navigate(DASHBOARD_PATH);
                            }}
                            variant="subtle"
                            sx={{
                                opacity: 0.5,
                                "&:hover": {
                                    opacity: 1,
                                }
                            }}
                        >
                            Skip plan
                        </Button>
                    }
                    {
                        (props.planningStage !== PlanningStage.Timebox) ?
                        <Button
                            onClick={() => {
                                props.setPlanningStage(props.planningStage + 1);
                            }}
                            rightIcon={<NavigateNextIcon />}
                            variant="default"
                        >
                            Next
                        </Button>
                        :
                        <>
                            <Button onClick={() => {
                                // only set today to planned
                                if (getToday().isSame(props.date, "day")) {
                                    const id = dateToDayId(props.date);
                                    // .then() without a callback properly waits for this to finish
                                    mutateList(id, { planned: true }).then();
                                }
                                navigate(DASHBOARD_PATH);
                            }}>
                                Let's Go!
                            </Button>
                        </>
                    }
                </Group>
            </Navbar.Section>
        </Navbar>
    );
};

export default PlannerLeftPanel;