/* `useLocalStorage`
 *
 * Features:
 *  - JSON Serializing
 *  - Also value will be updated everywhere, when value updated (via `storage` event)
 */

import { useEffect, useState } from 'react'

export default function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const item = localStorage.getItem(key)
  const [value, setValue] = useState(item ? JSON.parse(item) : defaultValue)

  useEffect(() => {

    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultValue))
    }

    function handler(e: StorageEvent) {
      if (e.key !== key) return

      const lsi = localStorage.getItem(key)
      setValue(JSON.parse(lsi ?? ''))
    }

    window.addEventListener('storage', handler)

    return () => {
      window.removeEventListener('storage', handler)
    }
  }, [])

  const setValueWrap = (value: T) => {
    try {
      setValue(value)

      localStorage.setItem(key, JSON.stringify(value))
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new StorageEvent('storage', { key }))
      }
    } catch (e) {
      console.error(e)
    }
  }

  return [value, setValueWrap]
}
