import { useEffect } from 'react';

export function log(...args: unknown[]) {
    console.debug('[react-select-table]', ...args);
}

export function useDebugMount(name = '') {
    useEffect(() => {
        console.debug('Component mounted', name);
    }, [name]);
}

export function useDebugUnmount(name = '') {
    useEffect(() => () => {
        console.debug('Component unmounted', name);
    }, [name]);
}