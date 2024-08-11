import { log } from '../utils/debugUtils';
import { MaybePromise } from '../utils/types';

type Job = () => void;

type AutoCommitSetting = 'always' | 'never' | 'timeout';

export default class JobBatch {
    #queuedJob: Job | null = null;
    #commitTimeout: number | null = null;
    #autoCommit: AutoCommitSetting = 'timeout';

    add(job: Job) {
        if (this.#queuedJob && job !== this.#queuedJob) {
            this.#commit();
            log('Commited job implicitly');
        }

        this.#queuedJob = job;

        if (this.#autoCommit === 'always')
            this.#commit();
        else if (this.#autoCommit === 'timeout')
            this.#scheduleCommit();
        else if (this.#autoCommit === 'never')
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

    async batch(callback: () => MaybePromise<void>) {
        this.#autoCommit = 'never';
        await callback();
        this.#autoCommit = 'timeout';

        this.#commit();
    }

    async sync(callback: () => MaybePromise<void>) {
        this.#autoCommit = 'always';
        await callback();
        this.#autoCommit = 'timeout';
    }
}