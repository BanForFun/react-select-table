import React, { useCallback, useContext } from 'react'
import GestureContext from '../context/GestureTarget'
import _ from 'lodash'

export default function withGestures(Component) {
  return function WithGestures({
    gestureTarget,
    onDualTap, onDualTapDirect,
    ...props
  }) {
    const gesture = useContext(GestureContext)

    props.handleGestureTouchStart = useCallback(e => {
      if (gesture.isDragging) return
      if (e.touches.length !== 2) return

      if (
        (_.every(e.touches, t => e.currentTarget === t.target) && onDualTapDirect?.(e) === false) ||
        (_.every(e.touches, t => e.currentTarget.contains(t.target)) && onDualTap?.(e) === false)
      ) e.stopPropagation()
    }, [gesture, onDualTap, onDualTapDirect])

    props.handleGesturePointerDownCapture = useCallback(() => {
      if (!gestureTarget) return
      gesture.target = gestureTarget
    }, [gesture, gestureTarget])

    return <Component {...props} />
  }
}
