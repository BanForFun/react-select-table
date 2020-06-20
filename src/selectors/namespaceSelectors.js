import { defaultMemoize } from "reselect"
import _ from "lodash";
import {getStatePath} from "../utils/optionUtils";

export const makeGetStateSlice = () => defaultMemoize(
    (state, namespace) => {
        const path = getStatePath(namespace);
        if (!path) return state;
        return _.get(state, path);
    }
);
