import useUserDB from "./useUserDB";
import useItemDB from "./useItemDB";
import useListDB from "./useListDB";
import { DO_LATER_LIST_ID } from "../globals";

const useDatabase = function() {
    const userDB = useUserDB();
    const itemDB = useItemDB();
    const listDB = useListDB();

    return {
        user: userDB,
        items: itemDB,
        lists: listDB
    };
};

export default useDatabase;
