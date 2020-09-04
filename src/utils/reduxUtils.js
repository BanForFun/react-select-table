import {tableOptions} from "./optionUtils";
import _ from "lodash";

export function getTableSlice(state, namespace) {
    const {path} = tableOptions[namespace];
    return path ? _.get(state, path) : state;
}
