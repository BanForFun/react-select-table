import { defaultMemoize } from "reselect"
import _ from "lodash";
import {getTablePath} from "../utils/optionUtils";

export const makeGetStateSlice = () => defaultMemoize(
    (state, namespace) => {
        const path = getTablePath(namespace);
        if (!path) return state;
        return _.get(state, path);
    }
);
