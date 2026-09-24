/* `useLocalStorage`
 *
 * Features:
 *  - JSON Serializing
 *  - Also value will be updated everywhere, when value updated (via `storage` event for other tabs
 *    and a keyed custom event for the current tab)
 */

import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react'

// Same-tab change notification. Carries the key so only hooks using that key react to it.
const LOCAL_STORAGE_CHANGE_EVENT = 'ayon:local-storage-change'

const notifyLocalStorageChange = (key: string) => {
  window.dispatchEvent(new CustomEvent<string>(LOCAL_STORAGE_CHANGE_EVENT, { detail: key }))
}

const parseJSONString = (value: string | null, fallback: any = null) => {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export const readLocalStorage = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback
  try {
    return parseJSONString(localStorage.getItem(key), fallback)
  } catch {
    return fallback
  }
}

// Write-only counterpart of useLocalStorage for non-render contexts (event handlers in hot components, plain modules). Dispatches the same change event the hook listens to,
// so every mounted useLocalStorage(key) instance picks the change up.
export const writeLocalStorage = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
    notifyLocalStorageChange(key)
  } catch (e) {
    console.error(e)
  }
}

export function useLocalStorage<T>(key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] {
  // Use a ref to hold the defaultValue to avoid dependency changes
  const defaultValueRef = useRef(defaultValue)
  defaultValueRef.current = defaultValue

  // Raw stored string of the current value, used to skip updates when nothing changed
  const rawValueRef = useRef<string | null>(null)

  const [value, setValue] = useState<T>(() => {
    const item = localStorage.getItem(key)
    rawValueRef.current = item
    return parseJSONString(item, defaultValue)
  })

  // Latest value, so the setter can resolve functional updates without a side effect in a state updater
  const valueRef = useRef(value)
  valueRef.current = value

  useEffect(() => {
    const syncFromStorage = (force = false) => {
      const currentItem = localStorage.getItem(key)
      if (!force && currentItem === rawValueRef.current) return
      rawValueRef.current = currentItem
      const nextValue = parseJSONString(currentItem, defaultValueRef.current)
      valueRef.current = nextValue
      setValue(nextValue)
    }

    // Read the latest value from localStorage whenever key changes
    syncFromStorage(true)

    if (!rawValueRef.current) {
      const defaultItem = JSON.stringify(defaultValueRef.current)
      localStorage.setItem(key, defaultItem)
      rawValueRef.current = defaultItem
    }

    // Other tabs: native storage event (key is null when storage was cleared)
    function storageHandler(e: StorageEvent) {
      if (e.key !== null && e.key !== key) return
      syncFromStorage()
    }

    // Current tab: keyed change event
    function changeHandler(e: Event) {
      if ((e as CustomEvent<string>).detail !== key) return
      syncFromStorage()
    }

    window.addEventListener('storage', storageHandler)
    window.addEventListener(LOCAL_STORAGE_CHANGE_EVENT, changeHandler)

    return () => {
      window.removeEventListener('storage', storageHandler)
      window.removeEventListener(LOCAL_STORAGE_CHANGE_EVENT, changeHandler)
    }
  }, [key]) // Remove defaultValue from dependencies

  const setValueWrap: Dispatch<SetStateAction<T>> = useCallback(
    (valueOrFn) => {
      try {
        const nextValue =
          typeof valueOrFn === 'function'
            ? (valueOrFn as (prevState: T) => T)(valueRef.current)
            : valueOrFn

        const nextItem = JSON.stringify(nextValue)
        valueRef.current = nextValue
        rawValueRef.current = nextItem
        setValue(nextValue)

        localStorage.setItem(key, nextItem)
        // notify on next tick to avoid updating other components during render
        setTimeout(() => notifyLocalStorageChange(key), 0)
      } catch (e) {
        console.error(e)
      }
    },
    [key],
  )

  return [value, setValueWrap]
}
