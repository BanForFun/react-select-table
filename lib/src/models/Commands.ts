import { Column } from '../utils/columnUtils';

class Command<TArgs> {
    observers: ((args: TArgs) => void)[] = [];

    addObserver(observer: (args: TArgs) => void) {
        this.observers.push(observer);

        return () => this.removeObserver(observer);
    }

    removeObserver(observer: (args: TArgs) => void) {
        const index = this.observers.indexOf(observer);
        if (index < -1) return;

        this.observers.splice(index, 1);
    }

    notify(args: TArgs) {
        for (const observer of this.observers) {
            observer(args);
        }
    }
}

export default class Commands<TRow> {
    updateHeader = new Command<{
        addedPosition: number,
        addedColumns: Column<TRow>[]
    } | {
        removedPosition: number;
        removedCount: number;
    }>();
}

export type CommandArgs<TRow> = {
    [K in keyof Commands<TRow>]: Commands<TRow>[K] extends Command<infer TArgs> ? TArgs : never;
}