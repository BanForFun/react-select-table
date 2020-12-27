import {useCallback} from "react";
import {useStore} from "react-redux";

export default function useGetSelectionArg(utils) {
    const store = useStore();

    return useCallback(() =>
        utils.getSelectionArg(utils.getStateSlice(store.getState())),
        [store, utils]
    );
}
