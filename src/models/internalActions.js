import TableActions from "./actions";

export default class InternalActions extends TableActions {
    get SET_EVENT_HANDLER() { return `${this.name}_SET_EVENT_HANDLER`; }
    get SET_COLUMN_COUNT() { return `${this.name}_SET_COLUMN_COUNT`; }

    setColumnCount = (count) => {
        return { type: this.SET_COLUMN_COUNT, count };
    }

    setEventHandler = (name, callback) => {
        return { type: this.SET_EVENT_HANDLER, name, callback };
    }
}