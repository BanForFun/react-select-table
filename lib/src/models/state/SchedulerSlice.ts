import Observable from '../Observable';
import StateSlice from '../StateSlice';
import { ActionCallback } from '../../utils/types';

type Job = () => void;

type Strategy = 'async' | 'sync' | 'batch';

export default class SchedulerSlice extends StateSlice {
    #queuedJob: Job | null = null;
    #commitTimeout: number | null = null;
    #strategy: Strategy = 'async';
    #free = new Observable();

    get isFree() {
        return this.#strategy === 'async' && this.#commitTimeout == null;
    }

    #notifyIfFree() {
        if (!this.isFree) return;
        this.#free.notify();
    }

    #commit() {
        if (this.#queuedJob == null) return;
        this.#cancelCommit();

        if (this.#strategy === 'sync')
            this.#commitSync();
        else if (this.#strategy === 'async')
            this.#scheduleCommit();
    }

    #queue(nextJob: Job | null) {
        const job = this.#queuedJob;
        this.#queuedJob = null;

        if (job != null && job !== nextJob) {
            job();
            this.#commitSync();
        }

        this.#queuedJob = nextJob;
        this.#commit();
    }

    #commitSync() {
        this.#queue(null);
    }

    #scheduleCommit() {
        this.#commitTimeout = setTimeout(() => {
            this.#commitTimeout = null;

            this.#commitSync();
            this.#notifyIfFree();
        });
    }

    #cancelCommit() {
        if (this.#commitTimeout != null)
            clearTimeout(this.#commitTimeout);

        this.#commitTimeout = null;
    }

    #withStrategy(strategy: Strategy, callback: ActionCallback) {
        const previous = this.#strategy;
        if (previous === strategy) {
            callback();
            return;
        }

        this.#strategy = strategy;
        callback();
        this.#strategy = previous;

        this.#commit();
        this.#notifyIfFree();
    }

    _add(job: Job) {
        this.#queue(job);
    }

    _onceFree(callback: ActionCallback) {
        if (this.isFree)
            callback();
        else
            this.#free.addOnceObserver(callback);
    }

    batch(callback: ActionCallback) {
        this.#withStrategy('batch', callback);
    }

    sync(callback: ActionCallback) {
        this.#withStrategy('sync', callback);
    }
}