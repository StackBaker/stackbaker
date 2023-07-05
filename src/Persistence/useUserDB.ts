import { useState } from "react";
// @ts-ignore
import { Store } from "tauri-plugin-store-api";

import { myStructuredClone, isDev } from "../globals";

const USER_FNAME = (isDev()) ? "dev-users.dat" : "users.dat";

type AuthData = null | {
    accessToken: string,
    refreshToken: string,
    expiryDate: string
};

type ValidAttr = number | string | boolean | AuthData | undefined;


export interface UserRubric {
    email: string,
    authData: AuthData,
    // in hours
    hoursInDay: number,
    // in minutes
    defaultEventLength: number,
    // in minutes
    dayCalLabelInterval: number,
    // in minutes
    dayCalSnapDuration: number,
    autoLoadPlanner: boolean
};

const defaultUser: UserRubric = {
    email: "",
    authData: null,
    hoursInDay: 30,
    defaultEventLength: 60,
    dayCalLabelInterval: 60,
    dayCalSnapDuration: 15,
    autoLoadPlanner: true
};

const useUserDB = function() {
    const store = new Store(USER_FNAME);
    const [user, setUser] = useState<UserRubric>(defaultUser);

    const get = async (key: keyof UserRubric) => {
        const val = await store.get(key);
        return val;
    }

    const set = (key: keyof UserRubric, val: ValidAttr) => {
        setUser({ ...user, [key]: val });
        store.set(key, val);
        store.save();
        console.log("user saved");
    }

    const del = (key: keyof UserRubric) => {
        let newUser = myStructuredClone(user);
        delete newUser[key];
        setUser(newUser);
        store.delete(key);
        store.save();
    }

    const replaceUser = (newUserConfig: UserRubric | null) => {
        if (newUserConfig === null) {
            newUserConfig = {
                ...defaultUser,
                email: user.email,
                authData: user.authData
            };
        }

        setUser(newUserConfig);
        for (const key in newUserConfig) {
            const k = key as keyof UserRubric;
            store.set(k, newUserConfig[k]);
        }
        store.save();
    }

    const load = async () => {
        await store.load();
        var newUser: UserRubric = myStructuredClone(defaultUser);

        // this automatically adds new attributes to the user on load
        for (const key in defaultUser) {
            const k = key as keyof UserRubric;
            const val = await get(k);
            if (val === undefined || val === null)
                set(k, defaultUser[k]);
            else
                newUser = { ...newUser, [k]: val };
        }

        setUser(newUser);
    }

    const clear = () => {
        // TODO: does this need .thens() to avoid the bug where clearing data
        // makes the calendar disappear?
        const email: string = user.email;
        const authData: AuthData = user.authData;
        store.clear();
        // assumption: set saves the database
        set("email", email);
        set("authData", authData);
        store.save();
    }

    const logout = () => {
        store.clear();
        store.save();
    }

    return { data: user, get, set, del, replaceUser, load, clear, logout };
};

export default useUserDB;
