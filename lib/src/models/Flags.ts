export default class Flags<T extends number> {
    #value = 0;

    get isClear() {
        return this.#value === 0;
    }

    #bit(flag: T) {
        return 1 << flag;
    }

    reset() {
        this.#value = 0;
    }

    set(flag: T) {
        this.#value |= this.#bit(flag);
    }

    isSet(flag: T) {
        return (this.#value & this.#bit(flag)) !== 0;
    }

    clear(flag: T) {
        this.#value &= ~this.#bit(flag);
    }

    toggle(flag: T) {
        this.#value ^= this.#bit(flag);
    }
}
