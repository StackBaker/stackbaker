import { Navbar, Space, Title, Text, Stack, Group, ActionIcon, Button } from "@mantine/core";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import { useNavigate } from "react-router-dom";

import * as paths from "../paths";
import type { planningStage, stageStrings } from "./plannerutils";

interface PlannerLeftPanelProps {
    planningStage: planningStage,
    setPlanningStage: React.Dispatch<React.SetStateAction<planningStage>>
};

const PlannerLeftPanel = function(props: PlannerLeftPanelProps) {
    const navigate = useNavigate();

    const titles: stageStrings = {
        0: "What do you want to get done today?",
        1: "Make a rough plan.",
        2: "Plan to deal with what you can't get to today.",
        3: "Finalize your day."
    };
    // TODO: trigger animation

    const tidbits: stageStrings = {
        0: "Don't worry about when or how – we'll go through that later.\
            Simply, empty your mind.",
        1: "Plan your day. If something can't fit in your schedule, drag it into the Later list.",
        2: "Drag and drop items from your Later list into the days you know \
            you'll be able to deal with them.",
        3: "Review your items and plan, and get ready for the day."
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
            <Navbar.Section grow>{}</Navbar.Section>
            <Navbar.Section>
                <Group position="apart" p={35}>
                    {
                        (props.planningStage !== 0) ?
                        <Button
                            onClick={() => props.setPlanningStage(props.planningStage - 1 as planningStage)}
                            leftIcon={<NavigateBeforeIcon />}
                            variant="default"
                        >
                            Back
                        </Button>
                        : <div></div>
                    }
                    {
                        (props.planningStage !== 3) ?
                        <Button
                            onClick={() => props.setPlanningStage(props.planningStage + 1 as planningStage)}
                            rightIcon={<NavigateNextIcon />}
                            variant="default"
                        >
                            Next
                        </Button>
                        : <Button onClick={() => navigate(paths.DASHBOARD_PATH)}>Go!</Button>
                    }
                </Group>
            </Navbar.Section>
        </Navbar>
    );
};

export default PlannerLeftPanel;