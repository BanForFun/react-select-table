import { useCallback } from 'react';
import useRequiredContext from './useRequiredContext';
import { TableContext } from '../context/tableContext';
import { flushSync } from 'react-dom';

export default function useUpdateStateSync() {
    const { state } = useRequiredContext(TableContext);

    return useCallback((callback: () => void) => {
        // Set timeout to ensure that flushSync isn't called from inside a React event handler,
        // which sometimes causes a recursive loop
        setTimeout(() => flushSync(() =>
            state.history.group(() => state.scheduler.sync(() => state.scheduler.batch(callback)))));
    }, [state]);
}