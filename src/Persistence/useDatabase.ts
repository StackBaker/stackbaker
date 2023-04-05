import useUserDB from "./useUserDB";
import useItemDB from "./useItemDB";
import useListDB from "./useListDB";
import useEventDB from "./useEventDB";

const useDatabase = function() {
    const userDB = useUserDB();
    const itemDB = useItemDB();
    const listDB = useListDB();
    const eventDB = useEventDB();

    return {
        user: userDB,
        items: itemDB,
        lists: listDB,
        events: useEventDB()
    };
};

export default useDatabase;
