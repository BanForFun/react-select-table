import { useCallback, useState } from 'react';

export default function useUpdate() {
    const [state, setState] = useState({});
    const update = useCallback(() => setState({}), []);

    return [update, state] as [() => void, unknown];
}