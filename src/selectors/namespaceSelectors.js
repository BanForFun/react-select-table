import { defaultMemoize } from "reselect"
import _ from "lodash";
import { tableOptions } from "../utils/optionUtils";

export const makeGetStateSlice = () => defaultMemoize(
    (state, namespace) => {
        const { path } = tableOptions[namespace];
        if (!path) return state;
        return _.get(state, path);
    }
);