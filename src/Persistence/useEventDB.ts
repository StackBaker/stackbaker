import { useState } from "react";
// @ts-ignore
import { Store } from "tauri-plugin-store-api";

import type { EventRubric, EventCollection } from "../Calendars/Event";
import { Id, myStructuredClone, isDev } from "../globals";

const EVENTS_FNAME = (isDev()) ? "dev-events.dat" : "events.dat";

const useEventDB = function() {
    const store = new Store(EVENTS_FNAME);
    const [events, setEvents] = useState<EventCollection>({});

    const get = async (key: Id) => {
        // the use of setState is not as a cache: it's an efficient duplicate
        // image of the store well suited to the frontend
        if (events?.hasOwnProperty(key)) {
            return events![key];
        }

        // otherwise miss to disk
        const val = await store.get(key);
        return val;
    }

    const set = (key: Id, val: EventRubric) => {
        if (events) {
            setEvents({ ...events, [key]: val });
        } else {
            let newEvents: EventCollection = { [key]: val };
            setEvents(newEvents);
        }

        store.set(key, val);
        store.save();
        console.log("events saved");
    }

    const has = async (eventId: Id): Promise<boolean> => {
        const eventInStore = await store.has(eventId);
        if (eventInStore) {
            return true;
        }

        return false;
    }

    const del = (key: Id) => {
        let newEvents: EventCollection;
        if (events)
            newEvents = myStructuredClone(events);
        else
            newEvents = {};
        delete newEvents[key];
        setEvents(newEvents);
        
        // then write through to disk
        store.delete(key);
        store.save();
    }

    const load = async () => {
        await store.load();
        const entries = await store.entries()

        var newEvents: EventCollection = {};
        for (const entry of entries) {
            const [key, val]: [key: Id, val: unknown] = entry;
            newEvents[key] = val as EventRubric;
        }
        setEvents(newEvents);
    }

    const clear = () => {
        setEvents({});
        store.clear();
        store.save();
    }

    return { data: events, get, set, has, del, load, clear };
}

export default useEventDB;
