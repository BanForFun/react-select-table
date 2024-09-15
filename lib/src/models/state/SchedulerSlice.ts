import Observable from '../Observable';
import StateSlice from '../StateSlice';
import { ActionCallback } from '../../utils/types';
import { flushSync } from 'react-dom';

type Job = () => void;

type Strategy = 'async' | 'sync' | 'batch';

export interface ScheduledFlush {
    promise: Promise<void>;
}

export default class SchedulerSlice extends StateSlice {
    #queuedJob: Job | null = null;
    #commitTimeout: number | null = null;
    #strategy: Strategy = 'async';
    #flush: ScheduledFlush | null = null;
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

    #withStrategy(strategy: Strategy, callback: ActionCallback): void {
        const previous = this.#strategy;
        if (previous === strategy)
            return callback();

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
        return this.#withStrategy('batch', callback);
    }

    sync(callback: ActionCallback) {
        return this.#withStrategy('sync', callback);
    }

    flush(callback: ActionCallback): ScheduledFlush {
        if (this.#flush != null) {
            callback();
            return this.#flush;
        }

        if (this.#strategy !== 'async')
            throw new Error('scheduler.flush() cannot be nested inside scheduler.sync() or scheduler.batch()');

        const promise = new Promise<void>(resolve => {
            setTimeout(() => {
                this.#flush = flush;
                this.sync(() => flushSync(() => this.batch(callback)));
                this.#flush = null;

                resolve();
            });
        });

        const flush: ScheduledFlush = { promise };
        return flush;
    }
}