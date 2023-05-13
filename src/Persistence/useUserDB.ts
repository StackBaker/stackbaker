import { useState } from "react";
// @ts-ignore
import { Store } from "tauri-plugin-store-api";

import { myStructuredClone } from "../globals";

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
    const [user, setUser] = useState<UserRubric>(defaultUser);

    const get = async (key: keyof UserRubric) => {
        const val = await store.get(key);
        return new Promise((resolve) => resolve(val));
    }

    const set = (key: keyof UserRubric, val: ValidAttr) => {
        setUser({ ...user, [key]: val });
        store.set(key, val);
        store.save();
        console.log("user saved");
    }

    const replaceUser = (newUserConfig: UserRubric | null) => {
        if (newUserConfig === null)
            newUserConfig = { ...defaultUser, email: user.email };

        setUser(newUserConfig);
        for (const key in newUserConfig) {
            const k = key as keyof UserRubric
            store.set(k, newUserConfig[k]);
        }
        store.save();
    }

    const load = async () => {
        await store.load();
        var newUser: UserRubric = myStructuredClone(defaultUser);

        for (const key in defaultUser) {
            const k = key as keyof UserRubric;
            const val = await get(k);
            if (!val)
                set(k, defaultUser[k]);
            else
                newUser = { ...newUser, [k]: val };
        }

        setUser(newUser);
    }

    const clear = () => {
        const email: string = user["email"];
        store.clear();
        // assumption: set saves the database
        set("email", email);
    }

    return { data: user, get, set, replaceUser, load, clear };
};

export default useUserDB;
