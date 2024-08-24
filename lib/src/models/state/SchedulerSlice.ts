import { log } from '../../utils/debugUtils';
import Observable from '../Observable';
import StateSlice from '../StateSlice';

type Job = () => void;

type CommitStrategy = 'sync' | 'batch' | 'async';

export default class SchedulerSlice extends StateSlice {
    #queuedJob: Job | null = null;
    #commitTimeout: number | null = null;
    #commitStrategy: CommitStrategy = 'async';
    #done = new Observable();

    get #hasJob() {
        return this.#queuedJob != null;
    }

    #commit() {
        if (this.#commitStrategy === 'sync') {
            this.#cancelScheduledCommit();
            this.#commitSync();
            this.#done.notify();
        } else if (this.#commitStrategy === 'async')
            this.#scheduleCommit();
        else if (this.#commitStrategy === 'batch')
            this.#cancelScheduledCommit();
    }

    #commitSync() {
        const job = this.#queuedJob;
        this.#queuedJob = null;
        job?.();
    }

    #cancelScheduledCommit() {
        if (this.#commitTimeout == null) return;
        clearTimeout(this.#commitTimeout);
        this.#commitTimeout = null;
    }

    #scheduleCommit() {
        this.#commitTimeout ??= setTimeout(() => {
            this.#commitTimeout = null;
            this.#commitSync();
            this.#done.notify();
        });
    }

    #withStrategy(strategy: CommitStrategy, callback: () => void) {
        const oldStrategy = this.#commitStrategy;

        this.#commitStrategy = strategy;
        callback();
        this.#commitStrategy = oldStrategy;
    }

    _add(job: Job) {
        if (this.#hasJob && this.#queuedJob != job) {
            this.#cancelScheduledCommit();
            this.#commitSync();
            log('Commited job implicitly');
        }

        this.#queuedJob = job;
        this.#commit();
    }

    _whenFree(callback: () => void) {
        if (!this.#hasJob)
            callback();
        else
            this.#done.addOnceObserver(callback);
    }

    batch(callback: () => void) {
        this.#withStrategy('batch', callback);
        if (this.#hasJob)
            this.#commit();
    }

    sync(callback: () => void) {
        this.#withStrategy('sync', callback);
    }

    async(callback: () => void) {
        this.#withStrategy('async', callback);
    }
}