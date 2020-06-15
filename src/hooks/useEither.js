import { useMemo } from 'react';

export default function useEither(first, second) {
    return useMemo(() =>
      first || second, [first, second]);
}
