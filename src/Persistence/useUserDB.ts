import { useRef } from "react";
import { Store } from "tauri-plugin-store-api";

import { SAVE_DELAY } from "./dbutils";

const USER_FNAME = "users.dat";
type UKEY = "email" | "auth";

// Config values
// day duration (min 24 hours), default duration of dropping events into calendar
// clear tasks database (DANGER)

const useUserDB = function() {
    const store = new Store(USER_FNAME);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const get = async (key: UKEY) => {
        const val = await store.get(key);
        return val;
    }

    const set = async (key: UKEY, val: string | number | Object) => {
        clearTimeout(timeoutRef.current!);
        await store.set(key, val);
        timeoutRef.current = setTimeout(() => store.save(), SAVE_DELAY);
    }

    const clear = store.clear;

    return { get, set, clear };
};

export default useUserDB;
