export default class Dependent<TDeps extends object = Record<never, never>> {
    #dependencies: TDeps;

    constructor(dependencies: TDeps) {
        this.#dependencies = dependencies;
    }

    isCompatible<T extends TDeps>(deps: T) {
        for (const name in this.#dependencies)
            if (this.#dependencies[name] !== deps[name]) return false;

        return true;
    }
}