import { createSelector } from "reselect"
import _ from "lodash";
import InternalActions from "../models/internalActions";

export const makeGetStateSlice = () =>
    createSelector(
        [
            state => state,
            (_, props) => props.statePath
        ],
        (state, path) => _.get(state, path, state)
    );

export const makeGetNamedActions = () =>
    createSelector(
        props => props.name,
        name => new InternalActions(name)
    )