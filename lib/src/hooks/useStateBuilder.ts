import { useCallback, useRef, useState } from 'react';

type ModifyCallback<T> = (callback: (value: T) => T) => void;

type CommitCallback = () => void;

export default function useStateBuilder<T>(createValue: () => T) {
    const valueRef = useRef<T>();
    const [value, setValue] = useState<T>(createValue);

    valueRef.current = createValue();

    const modify: ModifyCallback<T> = useCallback(callback => {
        valueRef.current = callback(valueRef.current!);
    }, []);

    const commit = useCallback(() => {
        setValue(valueRef.current!);
    }, []);

    return [value, modify, commit] as [T, ModifyCallback<T>, CommitCallback];
}