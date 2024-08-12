type IteratorsFor<T> = {
    [Index in keyof T]: Iterator<T[Index]>;
}

export function* table<T extends unknown[]>(...columns: IteratorsFor<T>): IterableIterator<T> {
    while (true) {
        const row: unknown[] = [];

        for (const column of columns) {
            const result = column.next();
            if (result.done) return;
            row.push(result.value);
        }

        yield row as T;
    }
}

export function* partialTable<T extends unknown[]>(...columns: IteratorsFor<T>): IterableIterator<Partial<T>> {
    while (true) {
        const row: unknown[] = [];

        let i = 0;
        let allDone = true;
        for (const column of columns) {
            const result = column.next();
            allDone &&= !!result.done;

            if (result.done) continue;
            row[i++] = result.value;
        }

        if (allDone) return;
        yield row as Partial<T>;
    }
}

export function* namedTable<T extends object>(columns: IteratorsFor<T>): IterableIterator<T> {
    while (true) {
        const row: Partial<T> = {};

        for (const name in columns) {
            const result = columns[name].next();
            if (result.done) return;

            row[name] = result.value;
        }

        yield row as T;
    }
}

export function* partialNamedTable<T extends object>(columns: IteratorsFor<T>): IterableIterator<Partial<T>> {
    while (true) {
        const row: Partial<T> = {};

        let allDone = true;
        for (const name in columns) {
            const result = columns[name].next();
            allDone &&= !!result.done;

            if (result.done) continue;
            row[name] = result.value;
        }

        if (allDone) return;
        yield row;
    }
}