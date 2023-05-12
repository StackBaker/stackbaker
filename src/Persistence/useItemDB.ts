import { useState } from "react";
// @ts-ignore
import { Store } from "tauri-plugin-store-api";

import type { ItemRubric, ItemCollection } from "../Item";
import { Id, myStructuredClone } from "../globals";

const ITEMS_FNAME = "items.dat";

const useItemDB = function() {
    const store = new Store(ITEMS_FNAME);
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
        if (items) {
            setItems({ ...items, [key]: val });
        } else {
            let newItems: ItemCollection = { [key]: val };
            setItems(newItems);
        }
        
        // then write through to disk
        store.set(key, val);
        store.save();
        console.log("items saved");
    }

    const del = (key: Id) => {
        let newItems: ItemCollection;
        if (items)
            newItems = myStructuredClone(items);
        else
            newItems = {};
        delete newItems[key];
        setItems(newItems);
        
        // then write through to disk
        store.delete(key);
        store.save();
    }

    const loadAll = async () => {
        const entries = await store.entries();
        
        var newItems: ItemCollection = {};
        for (const entry of entries) {
            const [key, val]: [key: Id, val: unknown] = entry;
            newItems[key] = val as ItemRubric;
        }
        setItems(newItems);
    }

    const clear = () => {
        setItems({});
        store.clear();
        store.save();
    }

    return { data: items, get, set, del, loadAll, clear };
}

export default useItemDB;
