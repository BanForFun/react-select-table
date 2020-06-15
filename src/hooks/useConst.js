import { useRef } from "react";

export default function useConst(value) {
  const ref = useRef(value);
  return ref.current;
}
