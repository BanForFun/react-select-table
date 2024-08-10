import { useContext } from 'react';
import { RequiredContext } from '../utils/contextUtils';

export default function useRequiredContext<T>(context: RequiredContext<T>): T {
    const value = useContext(context);
    if (value == null) throw new Error(`Provider not found for ${context.displayName ?? '(unknown)'} context`);

    return value;
}