import { log } from '../utils/debugUtils';
import { MaybePromise } from '../utils/types';
import { Event } from './Observable';

type Job = () => void;

type CommitStrategy = 'sync' | 'batch' | 'async';

export default class JobScheduler {
    #queuedJob: Job | null = null;
    #commitTimeout: number | null = null;
    #commitStrategy: CommitStrategy = 'async';
    #done = new Event();

    get #hasJob() {
        return this.#queuedJob != null;
    }

    #commit() {
        if (this.#commitStrategy === 'sync') {
            this.#_cancelScheduledCommit();
            this.#_commitSync();
            this.#done.notify();
        } else if (this.#commitStrategy === 'async')
            this.#_scheduleCommit();
        else if (this.#commitStrategy === 'batch')
            this.#_cancelScheduledCommit();
    }

    #_commitSync() {
        const job = this.#queuedJob;
        this.#queuedJob = null;
        job?.();
    }

    #_cancelScheduledCommit() {
        if (this.#commitTimeout == null) return;
        clearTimeout(this.#commitTimeout);
        this.#commitTimeout = null;
    }

    #_scheduleCommit() {
        this.#commitTimeout ??= setTimeout(() => {
            this.#commitTimeout = null;
            this.#_commitSync();
            this.#done.notify();
        });
    }

    async #withStrategy(strategy: CommitStrategy, callback: () => MaybePromise<void>) {
        const oldStrategy = this.#commitStrategy;

        this.#commitStrategy = strategy;
        await callback();
        this.#commitStrategy = oldStrategy;
    }

    add(job: Job) {
        if (this.#hasJob && this.#queuedJob != job) {
            this.#_cancelScheduledCommit();
            this.#_commitSync();
            log('Commited job implicitly');
        }

        this.#queuedJob = job;
        this.#commit();
    }

    whenFree(callback: () => void) {
        if (!this.#hasJob)
            callback();
        else
            this.#done.addOnceObserver(callback);
    }

    async batch(callback: () => MaybePromise<void>) {
        await this.#withStrategy('batch', callback);
        if (this.#hasJob)
            this.#commit();
    }

    async sync(callback: () => MaybePromise<void>) {
        await this.#withStrategy('sync', callback);
    }

    async async(callback: () => MaybePromise<void>) {
        await this.#withStrategy('async', callback);
    }
}