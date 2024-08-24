import { useCallback } from 'react';
import useRequiredContext from './useRequiredContext';
import { TableContext } from '../context/tableContext';
import { flushSync } from 'react-dom';

export default function useUpdateStateSync() {
    const { state } = useRequiredContext(TableContext);

    return useCallback((callback: () => void) => {
        flushSync(() => state.history.group(() => state.scheduler.sync(() => state.scheduler.batch(callback))));
    }, [state]);
}