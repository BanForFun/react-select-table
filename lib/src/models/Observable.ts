export default class Observable<TArgs extends unknown[] = []> {
    observers: ((...args: TArgs) => void)[] = [];

    addObserver(observer: (...args: TArgs) => void) {
        this.observers.push(observer);

        return () => this.removeObserver(observer);
    }

    removeObserver(observer: (...args: TArgs) => void) {
        const index = this.observers.indexOf(observer);
        if (index < -1) return;

        this.observers.splice(index, 1);
    }

    notify = (...args: TArgs) => {
        for (const observer of this.observers) {
            observer(...args);
        }
    };
}

export class Event<TArgs = undefined> extends Observable<TArgs extends undefined ? [] : [TArgs]> {

}