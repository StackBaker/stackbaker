import { useRef, useState } from "react";
import { Store } from "tauri-plugin-store-api";

import { SAVE_DELAY } from "./dbutils";
import type { ItemRubric, ItemCollection } from "../Item";
import type { Id } from "../globals";

const ITEMS_FNAME = "items.dat";

// TODO: periodically clean
// TODO: items seem to be being saved a lot, including when I just click the screen
const useItemDB = function() {
    const store = new Store(ITEMS_FNAME);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [items, setItems] = useState<ItemCollection>();

    const get = async (key: Id) => {
        // the use of setState is not as a cache: it's an efficient duplicate
        // image of the store well suited to the frontend
        if (items!.hasOwnProperty(key)) {
            return items![key];
        }

        // otherwise miss to disk
        const val = await store.get(key);
        return val;
    }

    const set = async (key: Id, val: ItemRubric) => {
        if (timeoutRef.current)
            clearTimeout(timeoutRef.current!);

        let newItems: ItemCollection;
        if (items)
            newItems = structuredClone(items);
        else
            newItems = {};
        newItems[key] = val;
        setItems(newItems);
        
        // then write through to disk
        await store.set(key, val)
            .then(() => {
                timeoutRef.current = setTimeout(() => {
                    store.save();
                    console.log("items saved");
                }, SAVE_DELAY);
            });
    }

    const del = async (key: Id) => {
        if (timeoutRef.current)
            clearTimeout(timeoutRef.current!);

        let newItems: ItemCollection;
        if (items)
            newItems = structuredClone(items);
        else
            newItems = {};
        delete newItems[key];
        setItems(newItems);
        
        // then write through to disk
        await store.delete(key)
            .then(() => {
                timeoutRef.current = setTimeout(() => store.save(), SAVE_DELAY);
            });
    }

    const loadAll = async () => {
        const entries = await store.entries()
        
        var newItems: ItemCollection = {};
        for (const entry of entries) {
            const [key, val]: [key: Id, val: unknown] = entry;
            newItems[key] = val as ItemRubric;
        }
        setItems(newItems);
    }

    const clear = async() => {
        await store.clear();
        await store.save();
    }

    return { data: items, get, set, del, loadAll, clear };
}

export default useItemDB;