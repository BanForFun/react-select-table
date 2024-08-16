type OptionalArg<T> = T extends undefined ? [] : [T];

type Observer<TArg> = (...args: OptionalArg<TArg>) => void;

export default class Observable<TArg = undefined> {
    #observers = new Set<Observer<TArg>>();
    #onceObservers = new Set<Observer<TArg>>();

    addObserver(observer: Observer<TArg>) {
        this.#observers.add(observer);
        return () => this.removeObserver(observer);
    }

    removeObserver(observer: Observer<TArg>) {
        this.#observers.delete(observer);
    }

    addOnceObserver(observer: Observer<TArg>) {
        this.#onceObservers.add(observer);
        return () => this.removeOnceObserver(observer);
    }

    removeOnceObserver(observer: Observer<TArg>) {
        this.#onceObservers.delete(observer);
    }

    notify = (...args: OptionalArg<TArg>) => {
        for (const observer of this.#observers)
            observer(...args);

        for (const onceObserver of this.#onceObservers)
            onceObserver(...args);

        this.#onceObservers.clear();
    };
}