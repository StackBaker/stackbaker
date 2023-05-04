import { useRef, useState } from "react";
// @ts-ignore
import { Store } from "tauri-plugin-store-api";

import { SAVE_DELAY } from "./dbutils";
import type { ListRubric, ListCollection } from "../List";
import { DAY_LIST_TITLE, DO_LATER_LIST_ID, DO_LATER_LIST_TITLE, Id, myStructuredClone } from "../globals";
import dayjs from "dayjs";
import { dateToDayId } from "../dateutils";

const LISTS_FNAME = "lists.dat";

// TODO: properly test this
// TODO: periodically clean the database
const useListDB = function() {
    const store = new Store(LISTS_FNAME);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [lists, setLists] = useState<ListCollection>();

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
    // TODO: if changing around async stuff works here, propagate it to other dbs
    const set = (key: Id, val: ListRubric) => {
        if (timeoutRef.current)
            clearTimeout(timeoutRef.current!);

        let newLists: ListCollection;
        if (lists)
            newLists = myStructuredClone(lists);
        else
            newLists = {};
        newLists[key] = val;
        setLists(newLists);

        store.set(key, val)
        timeoutRef.current = setTimeout(() => {
            store.save();
            console.log("lists saved")
        }, SAVE_DELAY);
    }

    const setMany = (keys: Id[], vals: ListRubric[]): boolean => {
        if (keys.length !== vals.length)
            return false;

        if (timeoutRef.current)
            clearTimeout(timeoutRef.current!);

        let newLists: ListCollection;
        if (lists)
            newLists = myStructuredClone(lists);
        else
            newLists = {};
        
        keys.map((k, i) => {
            let v = vals[i];
            newLists[k] = v;
            store.set(k, v);
        });
        setLists(newLists);
        
        timeoutRef.current = setTimeout(() => {
            store.save();
            console.log("lists saved")
        }, SAVE_DELAY);

        return true;
    }

    const has = async( listId: Id): Promise<boolean> => {
        const listInStore = await store.has(listId);
        if (listInStore) {
            return true;
        }

        return false;
    }

    const create = (date: dayjs.Dayjs | null): boolean => {
        // create a new empty list for a particular date or the do later list
        let listId;
        if (date === null)
            listId = DO_LATER_LIST_ID
        else
            listId = dateToDayId(date!);

        const newList = {
            listId: listId,
            title: (!date) ? DO_LATER_LIST_TITLE: DAY_LIST_TITLE,
            itemIds: [],
            planned: false
        };
        set(listId, newList);
        
        return true;
    }

    const del = (key: Id) => {
        if (timeoutRef.current)
            clearTimeout(timeoutRef.current!);

        let newLists: ListCollection;
        if (lists)
            newLists = myStructuredClone(lists);
        else
            newLists = {};
        delete newLists[key];
        setLists(newLists);
        
        // then write through to disk
        store.delete(key);
        timeoutRef.current = setTimeout(() => store.save(), SAVE_DELAY);
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
