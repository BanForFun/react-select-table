import { TableData } from '../utils/configUtils';
import { ReadonlyHeader } from './state/HeaderSlice';

export default class ColumnMap<TData extends TableData> {
    #map = new Map<ReadonlyHeader<TData>, HTMLTableColElement>();
    #spacer: HTMLTableColElement | null = null;

    set(key: ReadonlyHeader<TData>, value: HTMLTableColElement | null) {
        if (value == null) {
            this.#map.delete(key);
            return;
        }

        this.#map.set(key, value);
    }

    get(key: ReadonlyHeader<TData>) {
        const column = this.#map.get(key);
        if (!column)
            throw new Error('Invalid header');

        return column;
    }

    getAll() {
        return this.#map.values();
    }

    set spacer(value: HTMLTableColElement | null) {
        this.#spacer = value;
    }

    get spacer(): HTMLTableColElement {
        if (this.#spacer == null)
            throw new Error('Spacer is unset');

        return this.#spacer;
    }
}