import TableActions from "./actions";

export default class InternalActions extends TableActions {
    //Internal
    static SET_COLUMN_COUNT = "TABLE_SET_COLUMN_COUNT";

    setColumnCount = (count) =>
        this._getAction(self.SET_COLUMN_COUNT, { count });
}

const self = InternalActions;