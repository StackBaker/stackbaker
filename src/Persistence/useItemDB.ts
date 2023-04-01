import { useState, useRef } from "react";
import { Store } from "tauri-plugin-store-api";

import { SAVE_DELAY } from "./dbutils";
import type { ItemRubric, ItemCollection } from "../Item";
import type { Id } from "../globals";

const ITEMS_FNAME = "items.dat";

// IDEA: build it out only using the filesystem for now
// TODO: think about caching in RAM with useState
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

    const set = (key: Id, val: ItemRubric) => {
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
        store.set(key, val)
            .then(() => {
                timeoutRef.current = setTimeout(() => store.save(), SAVE_DELAY);
            });
    }

    const del = (key: Id) => {
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
        store.delete(key)
            .then(() => {
                timeoutRef.current = setTimeout(() => store.save(), SAVE_DELAY);
            });
    }

    const loadAll = () => {
        store.entries().then(entries => {
            var newItems: ItemCollection = {};
            for (const entry of entries) {
                const [key, val]: [key: Id, val: unknown] = entry;
                newItems[key] = val as ItemRubric;
            }
            setItems(newItems);
        })
    }

    return { data: items, get, set, del, loadAll };
}

export default useItemDB;
