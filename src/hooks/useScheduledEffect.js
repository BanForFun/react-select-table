import { useState, useEffect, useCallback } from 'react'

export default function useScheduledEffect(effect) {
  const [update, setUpdate] = useState(false)

  useEffect(effect, [effect, update])

  return useCallback(() => setUpdate(update => !update), [])
}
