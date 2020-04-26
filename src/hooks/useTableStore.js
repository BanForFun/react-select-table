import { useRef } from "react";
import configureStore from "../store/configureStore";

export default function useTableStore(options = undefined) {
    const store = useRef(configureStore(options));
    return store.current;
}