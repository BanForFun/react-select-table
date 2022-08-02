import { useRef } from 'react'
import _ from 'lodash'

export default function useShallowObjectMemo(obj) {
  const objRef = useRef(obj)

  if (!_.isEqual(obj, objRef.current))
    objRef.current = obj

  return objRef.current
}
