import {useCallback} from "react";
import {useSelector} from "react-redux";
import {getTableSlice} from "..";

export default function useTableSelector(ns) {
    return useCallback((selector, equalityFn = undefined) =>
        useSelector(state => selector(getTableSlice(state, ns)), equalityFn),
        [ns]
    );
}
