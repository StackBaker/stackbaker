import { useRef } from "react";
import { Store } from "tauri-plugin-store-api";

import { SAVE_DELAY } from "./dbutils";

const USER_FNAME = "users.dat";
type UKEY = "email" | "auth";

const useUserDB = function() {
    const store = new Store(USER_FNAME);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const get = async (key: UKEY) => {
        const val = await store.get(key);
        return val;
    }

    const set = (key: UKEY, val: string | number | Object) => {
        clearTimeout(timeoutRef.current!);
        store.set(key, val)
            .then(() => {
                timeoutRef.current = setTimeout(() => store.save(), SAVE_DELAY);
            });
    }

    return { get, set };
};

export default useUserDB;
