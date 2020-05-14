import TableActions from "./actions";

export default class InternalActions extends TableActions {
    //Internal
    static SET_EVENT_HANDLER = "TABLE_SET_EVENT_HANDLER";
    static SET_COLUMN_COUNT = "TABLE_SET_COLUMN_COUNT";

    setColumnCount = (count) =>
        this._getAction(self.SET_COLUMN_COUNT, { count });

    setEventHandler = (name, callback) =>
        this._getAction(self.SET_EVENT_HANDLER, { name, callback });
}

const self = InternalActions;