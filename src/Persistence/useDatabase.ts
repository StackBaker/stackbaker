import useUserDB from "./useUserDB";
import useListDB from "./useListDB";
import useEventDB from "./useEventDB";
import { isDev } from "../globals";

// @ts-ignore
import { Store } from "tauri-plugin-store-api";
import { getVersion } from '@tauri-apps/api/app';
import semver from "semver";

const LOGS_FNAME = (isDev()) ? "dev-logs.dat" : "logs.dat";
// list of versions that break the database
const DB_BREAKING_VERSIONS = ["1.0.0"]

const useDatabase = function() {
    const userDB = useUserDB();
    const listDB = useListDB();
    const eventDB = useEventDB();

    // Check versioning and clear data if updated to a breaking change
    const clearDBOnBreakingChange = async () => {
        const store = new Store(LOGS_FNAME);
        const appVersion = await getVersion();

        // for each database breaking version
        for (const version of DB_BREAKING_VERSIONS) {
            // if the current version of the app is past that version
            // make sure the DB has been cleared to accomodate the breaking change
            if (semver.gte(appVersion, version)) {
                const alreadyClearedDBForThisVersion = await store.get(version);

                if (!alreadyClearedDBForThisVersion) {
                    console.log("Current version", appVersion, "exceeds breaking version", version + ".",  "Clearing DB to commodate change");
                    await store.set(version, true);
                    userDB.clear();
                    listDB.clear();
                    eventDB.clear();
                } else {
                    console.log("Already cleared DB for breaking change in version", version);
                }
            }
        }
    }

    clearDBOnBreakingChange().then();

    return {
        user: userDB,
        lists: listDB,
        events: eventDB
    };
};

export default useDatabase;
