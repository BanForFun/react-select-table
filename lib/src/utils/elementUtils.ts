type Component = string | undefined | Record<string, boolean> | Component[];

function appendClass(old: string, value: string) {
    if (!value) return old;
    return old ? old + ' ' + value : value;
}

function resolveComponent(component: Component): string {
    if (typeof component === 'string') return component;

    if (Array.isArray(component))
        return buildClass(...component);

    let result = '';
    for (const name in component) {
        if (!Object.hasOwn(component, name)) continue;
        if (!component[name]) continue;

        result = appendClass(result, name);
    }

    return result;
}

export function buildClass(...components: Component[]): string {
    let result = '';
    for (const component of components) {
        result = appendClass(result, resolveComponent(component));
    }

    return result;
}