import { Column } from '../utils/columnUtils';

class Command<TArgs = {}> {
    observers: ((args: TArgs) => void)[] = [];

    addObserver(observer: (args: TArgs) => void) {
        this.observers.push(observer);
    }

    removeObserver(observer: (args: TArgs) => void) {
        const index = this.observers.indexOf(observer);
        if (index < -1) return false;

        this.observers.splice(index, 1);
    }

    notify(args: TArgs) {
        for (const observer of this.observers) {
            observer(args);
        }
    }
}

export default class Commands<TRow, TFilter> {
    updateHeader = new Command<{
        addedPosition: number,
        addedColumns: Column<TRow>[]
    } | {
        removedPosition: number;
        removedCount: number;
    }>();
}