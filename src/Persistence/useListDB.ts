import { useState } from "react";
// @ts-ignore
import { Store } from "tauri-plugin-store-api";

import type { ListRubric, ListCollection } from "../List";
import { DO_LATER_LIST_ID, myStructuredClone, isDev } from "../globals";
import type { Id } from "../globals";
import dayjs from "dayjs";
import { dateToDayId } from "../dateutils";

// TODO: write unit tests
const useListDB = function(fname: string = "") {
    if (!fname) {
        fname = (isDev()) ? "dev-lists.dat" : "lists.dat";
    }
    
    const store = new Store(fname);
    const [lists, setLists] = useState<ListCollection>({});

    const get = async (key: Id) => {
        // the use of setState is not as a cache: it's an efficient duplicate
        // image of the store well suited to the frontend
        if (lists?.hasOwnProperty(key)) {
            return lists![key];
        }

        // otherwise miss to disk
        const val = await store.get(key);
        return val;
    }

    // NOTE: the calls to setList should be synchronous, but the calls to store.set perhaps should be async
    const set = (key: Id, val: ListRubric) => {
        let newLists: ListCollection;
        if (lists) {
            setLists({ ...lists, [key]: val });
        } else {
            newLists = { [key]: val };
            setLists(newLists);
        }

        store.set(key, val);
        store.save();
        console.log("lists saved");
    }

    const setMany = (keys: Id[], vals: ListRubric[]): boolean => {
        if (keys.length !== vals.length) {
            return false;
        }

        let newLists: ListCollection;
        if (lists) {
            newLists = myStructuredClone(lists);
        } else {
            newLists = {};
        }
        
        keys.map((k, i) => {
            let v = vals[i];
            newLists[k] = v;
            store.set(k, v);
        });
        setLists(newLists);
        
        store.save();
        console.log("many lists saved");

        return true;
    }

    const has = async (listId: Id): Promise<boolean> => {
        const listInStore = await store.has(listId);
        if (listInStore) {
            return true;
        }

        return false;
    }

    const create = (date: dayjs.Dayjs | null): boolean => {
        // create a new empty list for a particular date or the do later list
        let listId;
        if (date === null) {
            listId = DO_LATER_LIST_ID
        } else {
            listId = dateToDayId(date!);
        }

        const newList: ListRubric = {
            listId: listId,
            planned: false,
            items: {}
        };
        set(listId, newList);
        
        return true;
    }

    const del = (key: Id) => {
        let newLists: ListCollection;
        if (lists) {
            newLists = myStructuredClone(lists);
        } else {
            newLists = {};
        }
        delete newLists[key];
        setLists(newLists);
        
        // then write through to disk
        store.delete(key);
        store.save();
    }

    const loadAll = async () => {
        await store.load();
        const entries = await store.entries()

        var newLists: ListCollection = {};
        for (const entry of entries) {
            const [key, val]: [key: Id, val: unknown] = entry;
            newLists[key] = val as ListRubric;
        }
        setLists(newLists);
    }

    // TODO: should these functions be async?
    const clear = () => {
        setLists({});
        store.clear();
        store.save();
    }

    // make sure the do later list is there
    has(DO_LATER_LIST_ID).then(x => {
        if (!x) {
            create(null);
        }
    });

    return { data: lists, get, set, setMany, has, create, del, loadAll, clear };
}

export default useListDB;
