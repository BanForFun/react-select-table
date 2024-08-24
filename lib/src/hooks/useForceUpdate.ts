import { useCallback, useState } from 'react';

export default function useForceUpdate() {
    const [state, setState] = useState({});
    const update = useCallback(() => setState({}), []);

    return [update, state] as [() => void, unknown];
}