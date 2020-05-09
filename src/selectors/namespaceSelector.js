import { createSelector } from "reselect"
import _ from "lodash";

export const makeGetStateSlice = () => createSelector(
    [
        state => state,
        (_, props) => props.statePath
    ],
    (state, path) => {
        if (!path) return state;

        const slice = _.get(state, path);
        if (slice) return slice;

        throw new Error(`No reducer found at '${path}'`);
    }
);