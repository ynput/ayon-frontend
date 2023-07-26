import { useEffect, useState } from 'react'

function useKeyPress(callback) {
  // State for keeping track of whether key is pressed
  const [keyPressed, setKeyPressed] = useState(null)

  useEffect(() => {
    if (keyPressed && callback) {
      callback(keyPressed)
    }
  }, [keyPressed])

  // If pressed key is our target key then set to true
  function downHandler(e) {
    setKeyPressed(e)
  }
  // If released key is our target key then set to false
  const upHandler = () => {
    setKeyPressed(null)
  }
  // Add event listeners
  useEffect(() => {
    window.addEventListener('keydown', downHandler)
    window.addEventListener('keyup', upHandler)
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener('keydown', downHandler)
      window.removeEventListener('keyup', upHandler)
    }
  }, []) // Empty array ensures that effect is only run on mount and unmount
  return keyPressed || undefined
}

export default useKeyPress
