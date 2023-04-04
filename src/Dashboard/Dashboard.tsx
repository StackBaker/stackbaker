import dayjs from "dayjs";
import { Header, Text } from "@mantine/core";

import { Id } from "../globals";
import ActionArea from "./ActionArea";
import type { ActionAreaProps } from "./ActionArea";
import LeftPanel from "./LeftPanel";
import type { LeftPanelProps } from "./LeftPanel";
import AppSkeleton from "../AppSkeleton";
import type { useAppSkeletonOutput, AppSkeletonProps } from "../AppSkeleton";
import type { ItemRubric } from "../Item";

type DashHeaderProps = Pick<useAppSkeletonOutput, "loadStage">

const DashHeader = (props: DashHeaderProps) => {
    const headerHeight = 50;

    return (
        <Header height={{ base: headerHeight /* , md: 70 */ }} p="md">
            <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <Text ff="JetBrains Mono">
                    {(props.loadStage === 2) ? "StackBaker" : "Loading..."}
                </Text>
            </div>
        </Header>
    );
}

interface DashboardProps extends AppSkeletonProps {};

const Dashboard = function(props: DashboardProps) {
    return (
        <AppSkeleton
            HeaderProps={DashHeaderProps}
        />
    );
}

export default Dashboard;