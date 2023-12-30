import { useState } from "react";
// @ts-ignore
import { Store } from "tauri-plugin-store-api";

import type { ListRubric, ListCollection } from "../List";
import { DO_LATER_LIST_ID, myStructuredClone, isDev } from "../globals";
import type { Id } from "../globals";
import dayjs from "dayjs";
import { dateToDayId } from "../dateutils";
import type { ItemRubric } from "../Item";

const useListDB = function(fname: string = "") {
    if (!fname) {
        fname = (isDev()) ? "dev-lists.dat" : "lists.dat";
    }
    
    const store = new Store(fname);
    const [lists, setLists] = useState<ListCollection>({});

    const getList = async (key: Id): Promise<ListRubric | null> => {
        // the use of setState is not as a cache: it's an efficient duplicate
        // image of the store well suited to the frontend
        if (lists?.hasOwnProperty(key)) {
            return lists![key];
        }

        // otherwise miss to disk
        const val: ListRubric | null = await store.get(key);
        return val;
    }

    const setList = async (key: Id, val: ListRubric): Promise<boolean> => {
        let newLists: ListCollection;
        if (lists) {
            setLists({ ...lists, [key]: val });
        } else {
            newLists = { [key]: val };
            setLists(newLists);
        }

        await store.set(key, val);
        await store.save();
        console.log("lists saved");
        return true;
    }

    const setManyLists = async (vals: ListRubric[]): Promise<boolean> => {
        let newLists: ListCollection;
        if (lists) {
            newLists = myStructuredClone(lists);
        } else {
            newLists = {};
        }

        for (const v of vals) {
            newLists[v.listId] = v;
            await store.set(v.listId, v);
        }
        setLists(newLists);
        
        await store.save();
        console.log("many lists saved");

        return true;
    }

    const hasList = async (listId: Id): Promise<boolean> => {
        const listInStore = await store.has(listId);
        if (listInStore) {
            return true;
        }

        return false;
    }

    const createList = (date: dayjs.Dayjs | null): boolean => {
        // create a new empty list for a particular date or the do later list
        let listId: Id;
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
        setList(listId, newList);
        
        return true;
    }

    const delList = (key: Id): boolean => {
        let newLists: ListCollection;
        if (lists) {
            newLists = myStructuredClone(lists);
        } else {
            newLists = {};
        }
        delete newLists[key];
        setLists(newLists);
        
        store.delete(key);
        store.save();

        return true;
    }

    const getItem = async (itemId: Id, listId: Id): Promise<ItemRubric | null> => {
        const lst = await getList(listId);
        if (lst === null) {
            return null;
        }

        if (lst!.items.hasOwnProperty(itemId)) {
            return lst!.items[itemId];
        }
        return null;
    }

    const setItem = async (itemId: Id, newVal: ItemRubric, listId: Id): Promise<boolean> => {
        // do not allow this function to create lists
        const lst = await getList(listId);
        if (lst === null) {
            return false;
        }

        lst!.items[itemId] = newVal;
        setList(listId, lst);

        return true;
    }

    const delItem = async (itemId: Id, listId: Id) => {
        const lst = await getList(listId);
        if (lst === null) {
            return false;
        }

        delete lst!.items[itemId];
        setList(listId, lst);

        return true;
    }

    const load = async (): Promise<boolean> => {
        await store.load();
        const entries = await store.entries()

        var newLists: ListCollection = {};
        for (const entry of entries) {
            const [key, val]: [key: Id, val: unknown] = entry;
            newLists[key] = val as ListRubric;
        }
        setLists(newLists);

        return true;
    }

    const clear = () => {
        setLists({});
        store.clear();
        store.save();
    }

    // make sure the do later list is there
    hasList(DO_LATER_LIST_ID).then(x => {
        if (!x) {
            createList(null);
        }
    });

    return {
        data: lists,
        getList,
        setList,
        setManyLists,
        hasList,
        createList,
        delList,
        getItem,
        setItem,
        delItem,
        load,
        clear
    }
}

export default useListDB;
