export default class Dependent<TDeps extends object = object> {
    #dependencies: TDeps;

    constructor(public dependencies: TDeps) {
        this.#dependencies = dependencies;
    }

    assertCompatible(deps: TDeps) {
        for (const name in this.#dependencies) {
            if (this.#dependencies[name] !== deps[name])
                throw new Error(`Dependencies of type ${name} are not compatible`);
        }
    }
}

export type Dependencies<T extends Dependent> = T extends Dependent<infer TDeps> ? TDeps : never;