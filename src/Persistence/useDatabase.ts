import useUserDB from "./useUserDB";
import useItemDB from "./useItemDB";

const useDatabase = function() {
    const userDB = useUserDB();
    const itemDB = useItemDB();

    return {
        user: userDB,
        items: itemDB
    };
};

export default useDatabase;
