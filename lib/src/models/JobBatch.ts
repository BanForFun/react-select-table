type Job = () => void;

export default class JobBatch {
    #lastJob: Job | null = null;
    #autoCommit: boolean = true;

    add(job: Job) {
        if (this.#autoCommit) {
            job();
            return;
        }

        if (job != this.#lastJob) {
            console.warn('Commited job implicitly');
            this.#lastJob?.();
        }

        this.#lastJob = job;
    }

    batch(callback: () => void) {
        this.#autoCommit = false;
        callback();
        this.#autoCommit = true;

        if (this.#lastJob == null) return;
        this.#lastJob();
        this.#lastJob = null;
    }
}