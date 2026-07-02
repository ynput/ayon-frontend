import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react'

const parseJSONString = (value: string | null, fallback: any = null) => {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export const readSessionStorage = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback
  try {
    return parseJSONString(sessionStorage.getItem(key), fallback)
  } catch {
    return fallback
  }
}

export const writeSessionStorage = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
    // Dispatches to the same tab to keep other mounted hooks in sync
    window.dispatchEvent(new Event('session-storage'))
  } catch (e) {
    console.error(e)
  }
}

export function useSessionStorage<T>(
  key: string,
  defaultValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const defaultValueRef = useRef(defaultValue)
  defaultValueRef.current = defaultValue

  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue
    return parseJSONString(sessionStorage.getItem(key), defaultValue)
  })

  useEffect(() => {
    const currentItem = sessionStorage.getItem(key)
    setValue(parseJSONString(currentItem, defaultValueRef.current))

    if (!currentItem) {
      sessionStorage.setItem(key, JSON.stringify(defaultValueRef.current))
    }

    function handler(e: Event | StorageEvent) {
      // If it's a native StorageEvent (e.g., from an iframe), check the key
      if ('key' in e && e.key && e.key !== key) return

      const ssi = sessionStorage.getItem(key)
      setValue(parseJSONString(ssi, defaultValueRef.current))
    }

    // Listen to both native storage events and our custom same-tab event
    window.addEventListener('session-storage', handler)
    window.addEventListener('storage', handler)

    return () => {
      window.removeEventListener('session-storage', handler)
      window.removeEventListener('storage', handler)
    }
  }, [key])

  const setValueWrap: Dispatch<SetStateAction<T>> = useCallback(
    (valueOrFn) => {
      try {
        setValue((prevValue) => {
          const nextValue =
            typeof valueOrFn === 'function'
              ? (valueOrFn as (prevState: T) => T)(prevValue)
              : valueOrFn

          sessionStorage.setItem(key, JSON.stringify(nextValue))
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('session-storage'))
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
