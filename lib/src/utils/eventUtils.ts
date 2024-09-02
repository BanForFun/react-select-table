export const getAddEventListener = <M>() => <E extends keyof M>(
    target: EventTarget,
    event: E & string,
    listener: (e: M[E]) => void,
    options?: AddEventListenerOptions
) => {
    target.addEventListener(event, listener as EventListener, options);
    return () => target.removeEventListener(event, listener as EventListener, options);
};

export const addElementEventListener = getAddEventListener<HTMLElementEventMap>();