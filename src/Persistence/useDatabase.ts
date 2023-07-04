import useUserDB from "./useUserDB";
import useListDB from "./useListDB";
import useEventDB from "./useEventDB";

const useDatabase = function() {
    const userDB = useUserDB();
    const listDB = useListDB();
    const eventDB = useEventDB();

    return {
        user: userDB,
        lists: listDB,
        events: eventDB
    };
};

export default useDatabase;
