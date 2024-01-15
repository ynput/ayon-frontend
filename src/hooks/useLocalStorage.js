import { useState, useEffect } from 'react'

const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.log(error)
      return initialValue
    }
  })

  // Event listener to update the state when local storage changes
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.detail.key === key) {
        setStoredValue(event.detail.value)
      }
    }

    window.addEventListener('localStorageChange', handleStorageChange)

    return () => {
      window.removeEventListener('localStorageChange', handleStorageChange)
    }
  }, [key])

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
        // Dispatch event
        window.dispatchEvent(
          new CustomEvent('localStorageChange', { detail: { key, value: valueToStore } }),
        )
      }
    } catch (error) {
      console.log(error)
    }
  }

  return [storedValue, setValue]
}

export default useLocalStorage
