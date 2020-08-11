import {getTablePath} from "./optionUtils";
import _ from "lodash";

export function getTableSlice(state, namespace) {
    const path = getTablePath(namespace);
    return path ? _.get(state, path) : state;
}
