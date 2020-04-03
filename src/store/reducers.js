import { combineReducers } from "redux";

export default function configureReducer(asyncReducers) {
    if (!asyncReducers)
        return state => state;

    return combineReducers({
        ...asyncReducers,
        //Add any fixed reducers here
    });
}