import { useCallback } from 'react'

export default function useStripArgs(callback) {
  return useCallback(() => callback(), [callback])
}
