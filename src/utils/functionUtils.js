export function tryCall(func, ...args) {
    if (typeof func === "function")
        return func(...args);
}