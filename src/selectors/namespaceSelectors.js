import { createSelector } from "reselect"
import _ from "lodash";

export const makeGetStateSlice = () => createSelector(
    [
        state => state,
        (_, props) => props.statePath
    ],
    (state, path) => {
        if (!path) return state;
        return _.get(state, path);
    }
);