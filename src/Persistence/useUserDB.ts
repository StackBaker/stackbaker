import { useRef, useState } from "react";
import { Store } from "tauri-plugin-store-api";

import { SAVE_DELAY } from "./dbutils";

const USER_FNAME = "users.dat";

type ValidAttr = number | string;

export interface UserRubric {
    email: string,
    hoursInDay: number,
    // in minutes
    defaultEventLength: number
};

const defaultUser: UserRubric = {
    email: "",
    hoursInDay: 30,
    defaultEventLength: 60
};

const useUserDB = function() {
    const store = new Store(USER_FNAME);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [user, setUser] = useState<UserRubric>(defaultUser);

    const get = async (key: keyof UserRubric) => {
        const val = await store.get(key);
        return new Promise((resolve, reject) => resolve(val));
    }

    const set = async (key: keyof UserRubric, val: ValidAttr) => {
        clearTimeout(timeoutRef.current!);
        setUser({ ...user!, [key]: val });
        await store.set(key, val);
        timeoutRef.current = setTimeout(() => store.save(), SAVE_DELAY);
    }

    const replaceUser = (newUserConfig: UserRubric | null) => {
        if (newUserConfig === null)
            newUserConfig = { ...defaultUser, email: user.email };

        for (const key in newUserConfig) {
            const k = key as keyof UserRubric
            set(k, newUserConfig[k]);
        }
        setUser(structuredClone(newUserConfig));
    }

    const load = async () => {
        await store.load();
        var newUser: UserRubric = structuredClone(defaultUser);

        for (const key in defaultUser) {
            const k = key as keyof UserRubric
            const val = await get(k);
            if (!val)
                await set(k, defaultUser[k]);
            else
                newUser = { ...newUser, [k]: val };
        }

        setUser(newUser);
    }

    const clear = async () => {
        const email: string = (await get("email")) as string;
        await store.clear();
        await set("email", email);
    }

    return { data: user, get, set, replaceUser, load, clear };
};

export default useUserDB;
