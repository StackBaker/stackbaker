import { useRef, useState } from "react";
import { Store } from "tauri-plugin-store-api";

import { SAVE_DELAY } from "./dbutils";
import type { ListRubric, ListCollection } from "../List";
import { DO_LATER_LIST_ID, DO_LATER_LIST_TITLE, Id } from "../globals";
import dayjs from "dayjs";
import { dateToDayId } from "../dateutils";

const LISTS_FNAME = "lists.dat";

// TODO: properly test this
// TODO: rewrite everything to async / await?
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

    const set = async (key: Id, val: ListRubric) => {
        if (timeoutRef.current)
            clearTimeout(timeoutRef.current!);

        let newLists: ListCollection;
        if (lists)
            newLists = structuredClone(lists);
        else
            newLists = {};
        newLists[key] = val;
        setLists(newLists);
        
        // then write through to disk
        await store.set(key, val)
            .then(() => {
                timeoutRef.current = setTimeout(() => store.save(), SAVE_DELAY);
            });
    }

    const create = async (date: dayjs.Dayjs | null): Promise<boolean> => {
        // create a new empty list for a particular date or the do later list
        // TODO: this is crap
        let listId;
        if (date === null)
            listId = DO_LATER_LIST_ID
        else
            listId = dateToDayId(date!);
        
        if (lists?.hasOwnProperty(listId)) {
            return false;
        }

        const newList = {
            listId: listId,
            title: (date) ? date!.startOf("day").format() : DO_LATER_LIST_TITLE,
            itemIds: [],
            planned: false
        };
        await set(listId, newList);
        
        return true;
    }

    const del = async (key: Id) => {
        if (timeoutRef.current)
            clearTimeout(timeoutRef.current!);

        let newLists: ListCollection;
        if (lists)
            newLists = structuredClone(lists);
        else
            newLists = {};
        delete newLists[key];
        setLists(newLists);
        
        // then write through to disk
        await store.delete(key)
            .then(() => {
                timeoutRef.current = setTimeout(() => store.save(), SAVE_DELAY);
            });
    }

    const loadAll = async () => {
        const entries = await store.entries()

        var newLists: ListCollection = {};
        for (const entry of entries) {
            const [key, val]: [key: Id, val: unknown] = entry;
            newLists[key] = val as ListRubric;
        }
        setLists(newLists);
    }

    // make sure the do later list is there
    get(DO_LATER_LIST_ID).then(x => {
        if (!x) {
            create(null);
        }
    })

    return { data: lists, get, set, create, del, loadAll };
}

export default useListDB;