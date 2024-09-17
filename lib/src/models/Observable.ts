import { Tuple } from '../utils/types';

type Observer<TArgs extends Tuple> = (...args: TArgs) => void;

export default class Observable<TArgs extends Tuple = []> {
    #observers = new Set<Observer<TArgs>>();
    #onceObservers = new Set<Observer<TArgs>>();

    addObserver(observer: Observer<TArgs>) {
        this.#observers.add(observer);
        return () => this.removeObserver(observer);
    }

    removeObserver(observer: Observer<TArgs>) {
        this.#observers.delete(observer);
    }

    addOnceObserver(observer: Observer<TArgs>) {
        this.#onceObservers.add(observer);
        return () => this.removeOnceObserver(observer);
    }

    removeOnceObserver(observer: Observer<TArgs>) {
        this.#onceObservers.delete(observer);
    }

    notify = (...args: TArgs) => {
        for (const observer of this.#observers)
            observer(...args);

        for (const onceObserver of this.#onceObservers)
            onceObserver(...args);

        this.#onceObservers.clear();
    };
}