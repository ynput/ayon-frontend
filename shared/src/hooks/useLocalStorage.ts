/* `useLocalStorage`
 *
 * Features:
 *  - JSON Serializing
 *  - Also value will be updated everywhere, when value updated (via `storage` event)
 */

import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react'

const parseJSONString = (value: string | null, fallback: any = null) => {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export const readLocalStorage = <T>(key: string, fallback: T): T =>
  parseJSONString(localStorage.getItem(key), fallback)

// Write-only counterpart of useLocalStorage for non-render contexts (event handlers in hot components, plain modules). Dispatches the same storage event the hook listens to,
// so every mounted useLocalStorage(key) instance picks the change up.
export const writeLocalStorage = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new StorageEvent('storage', { key }))
}

export function useLocalStorage<T>(key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] {
  // Use a ref to hold the defaultValue to avoid dependency changes
  const defaultValueRef = useRef(defaultValue)
  defaultValueRef.current = defaultValue

  const [value, setValue] = useState<T>(() => {
    const item = localStorage.getItem(key)
    return parseJSONString(item, defaultValue)
  })

  useEffect(() => {
    // Read the latest value from localStorage whenever key changes
    const currentItem = localStorage.getItem(key)
    setValue(parseJSONString(currentItem, defaultValueRef.current))

    if (!currentItem) {
      localStorage.setItem(key, JSON.stringify(defaultValueRef.current))
    }

    function handler(e: StorageEvent) {
      if (e.key !== key) return

      const lsi = localStorage.getItem(key)
      setValue(parseJSONString(lsi, defaultValueRef.current))
    }

    window.addEventListener('storage', handler)

    return () => {
      window.removeEventListener('storage', handler)
    }
  }, [key]) // Remove defaultValue from dependencies

  const setValueWrap: Dispatch<SetStateAction<T>> = useCallback(
    (valueOrFn) => {
      try {
        setValue((prevValue) => {
          const nextValue =
            typeof valueOrFn === 'function'
              ? (valueOrFn as (prevState: T) => T)(prevValue)
              : valueOrFn

          localStorage.setItem(key, JSON.stringify(nextValue))
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new StorageEvent('storage', { key }))
          }
          return nextValue
        })
      } catch (e) {
        console.error(e)
      }
    },
    [key],
  )

  return [value, setValueWrap]
}
