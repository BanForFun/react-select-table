import { useEffect } from 'react';
import useOnce from "./useOnce";

export default function useEffectInit(effect, deps) {
    useOnce(effect);
    useEffect(effect, deps);
}