import { AppShell, Text, Header } from "@mantine/core";

import DashboardMain from "./DashboardMain";
import DashboardLeftPanel from "./DashboardLeftPanel";
import coordinateBackendAndState from "../coordinateBackendAndState";
import type { coordinateBackendAndStateProps } from "../coordinateBackendAndState";
import "../styles.css"

import {
    checkUpdate,
    installUpdate,
    onUpdaterEvent,
} from '@tauri-apps/api/updater'
import { relaunch } from '@tauri-apps/api/process'

type DashboardProps = coordinateBackendAndStateProps;

const Dashboard = function(props: DashboardProps) {
    const actionAreaHeight = "95vh";
    const headerHeight = 50;
    
    const coordination = coordinateBackendAndState(props);

    const func = async () => {
        const unlisten = await onUpdaterEvent(({ error, status }) => {
            // This will log all updater events, including status updates and errors.
            console.log('Updater event', error, status);
        })
        
        // you need to call unlisten if your handler goes out of scope, for example if the component is unmounted.
        unlisten()

        try {
            const { shouldUpdate, manifest } = await checkUpdate()

            if (shouldUpdate) {
                // You could show a dialog asking the user if they want to install the update here.
                console.log(
                    `Installing update ${manifest?.version}, ${manifest?.date}, ${manifest?.body}`
                )

                // Install the update. This will also restart the app on Windows!
                //await installUpdate()

                // On macOS and Linux you will need to restart the app manually.
                // You could use this step to display another confirmation dialog.
                //await relaunch()
            }
        } catch (error) {
            console.error("c", error)
        }
    }

    // have to do this sx thing because AppShell automatically renders too large
    return (
        <AppShell
            sx={{
                main: {
                    minHeight: actionAreaHeight,
                    maxHeight: actionAreaHeight,
                    paddingTop: headerHeight
                }
            }}
            navbarOffsetBreakpoint="sm"
            navbar={
                (coordination.loadStage !== 2) ? <div></div> :
                <DashboardLeftPanel
                    user={coordination.user}
                    date={props.date}
                    editUser={coordination.editUser}
                    setDate={props.setDate}
                    clearEverything={coordination.clearEverything}
                />
            }
            header={
                <Header height={{ base: headerHeight /* , md: 70 */ }} p="md">
                    <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                        <Text className="dash-header">
                            {(coordination.loadStage === 2) ? "StackBaker" : "Loading..."}
                        </Text>
                    </div>
                </Header>
            }
        >
            {
                (coordination.loadStage !== 2) ? <div></div>
                :
                <DashboardMain
                    user={coordination.user}
                    date={props.date}
                    items={coordination.items}
                    lists={coordination.relevantListCollection}
                    events={coordination.events}
                    createItem={coordination.createItem}
                    mutateItem={coordination.mutateItem}
                    deleteItem={coordination.deleteItem}
                    mutateLists={coordination.mutateLists}
                    saveEvent={coordination.saveEvent}
                    deleteEvent={coordination.deleteEvent}
                />
            }
            
        </AppShell>
    );
}

export default Dashboard;