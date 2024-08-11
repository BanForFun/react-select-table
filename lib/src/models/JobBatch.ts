import { log } from '../utils/debugUtils';
import { MaybePromise } from '../utils/types';

type Job = () => void;

type CommitBehaviour = 'sync' | 'batch' | 'async';

export default class JobBatch {
    #queuedJob: Job | null = null;
    #commitTimeout: number | null = null;
    #commitBehaviour: CommitBehaviour = 'async';

    add(job: Job) {
        if (this.#queuedJob && job !== this.#queuedJob) {
            this.#commit();
            log('Commited job implicitly');
        }

        this.#queuedJob = job;

        if (this.#commitBehaviour === 'sync')
            this.#commit();
        else if (this.#commitBehaviour === 'async')
            this.#scheduleCommit();
        else if (this.#commitBehaviour === 'batch')
            this.#cancelScheduledCommit();
    }

    #commit() {
        this.#cancelScheduledCommit();

        this.#queuedJob?.();
        this.#queuedJob = null;
    };

    #scheduleCommit() {
        this.#commitTimeout ??= setTimeout(() => {
            this.#commitTimeout = null;
            this.#commit();
        });
    }

    #cancelScheduledCommit() {
        if (this.#commitTimeout != null)
            clearTimeout(this.#commitTimeout);

        this.#commitTimeout = null;
    }

    async #withBehaviour(behaviour: CommitBehaviour, callback: () => MaybePromise<void>) {
        const oldBehaviour = this.#commitBehaviour;

        this.#commitBehaviour = behaviour;
        await callback();
        this.#commitBehaviour = oldBehaviour;
    }

    async batch(callback: () => MaybePromise<void>) {
        await this.#withBehaviour('batch', callback);
        this.#commit();
    }

    async sync(callback: () => MaybePromise<void>) {
        await this.#withBehaviour('sync', callback);
    }

    async async(callback: () => MaybePromise<void>) {
        await this.#withBehaviour('async', callback);
    }
}