import { ElementRef } from '../hooks/useElementRef';
import { CleanupCallback, StringKeyOf } from './types';
import { useCallback } from 'react';
import useDeepMemo from '../hooks/useDeepMemo';
import useCurrentCallback from '../hooks/useCurrentCallback';

export default function createEventManager<B extends EventTarget, M extends object>() {
    function createGroup() {
        const removeListenerCallbacks = new Set<CleanupCallback>();

        return {
            addListener<T extends B, E extends StringKeyOf<M>>(
                target: T,
                event: E,
                listener: (this: T, e: M[E]) => void,
                options?: AddEventListenerOptions
            ) {
                const eventListener = listener as EventListener;
                target.addEventListener(event, eventListener, options);

                removeListenerCallbacks.add(() =>
                    target.removeEventListener(event, eventListener, options));
            },
            removeAllListeners() {
                for (const callback of removeListenerCallbacks)
                    callback();

                removeListenerCallbacks.clear();
            }
        };
    }

    return { createGroup };
}

export function createElementEventManager<B extends HTMLElement, M extends object>() {
    const manager = createEventManager<B, M>();

    function useListener<T extends B, E extends StringKeyOf<M>>(
        targetRef: ElementRef<T>,
        event: E,
        listener: (this: T, e: M[E]) => void,
        options?: AddEventListenerOptions
    ) {
        const memoOptions = useDeepMemo(options);
        const memoListener = useCurrentCallback(listener);

        targetRef.useEffect(useCallback((element) => {
            const group = manager.createGroup();
            group.addListener(element, event, memoListener, memoOptions);
            return () => group.removeAllListeners();
        }, [event, memoOptions, memoListener]));
    }

    return Object.assign(manager, { useListener });
}

export const elementEventManager = createElementEventManager<HTMLElement, HTMLElementEventMap>();
export const windowEventManager = createEventManager<Window, WindowEventMap>();