import useUserDB from "./useUserDB";
import useItemDB from "./useItemDB";
import useListDB from "./useListDB";
import useEventDB from "./useEventDB";

var count = 0;

const useDatabase = function() {
    // console.log("db opened", count);
    count += 1;
    const userDB = useUserDB();
    const itemDB = useItemDB();
    const listDB = useListDB();
    const eventDB = useEventDB();

    return {
        user: userDB,
        items: itemDB,
        lists: listDB,
        events: eventDB
    };
};

export default useDatabase;
