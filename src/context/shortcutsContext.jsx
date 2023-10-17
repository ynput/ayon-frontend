import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import useKeyPress from '../hooks/useKeyPress'
import { useNavigate } from 'react-router'
import { useDispatch } from 'react-redux'
import { toggleMenuOpen } from '../features/context'
import { useLogOutMutation } from '../services/auth/getAuth'

const ShortcutsContext = createContext()

function ShortcutsProvider(props) {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // keep track of what's being hovered
  const [hovered, setHovered] = useState(null)

  useEffect(() => {
    document.addEventListener('mouseover', (e) => {
      setHovered(e.target)
    })

    return () => {
      // clean up event listeners
      document.removeEventListener('mouseover', (e) => {
        setHovered(e.target)
      })
    }
  }, [])

  // logout
  const [logout] = useLogOutMutation()

  // keep track of the last key pressed
  const [lastPressed, setLastPressed] = useState(null)
  // disable shortcuts
  const [disabled, setDisabled] = useState(false)

  // last key pressed should be reset after 200ms
  useEffect(() => {
    const timer = setTimeout(() => setLastPressed(null), 400)
    return () => clearTimeout(timer)
  }, [lastPressed])

  const navigation = useMemo(
    () => [
      // project settings
      { key: 'p+p', action: () => navigate('/manageProjects/anatomy') },
      // studio settings
      { key: 's+s', action: () => navigate('/settings/studio') },
      // dashboard
      { key: 'd+d', action: () => navigate('/dashboard') },
      // user settings
      { key: 'u+u', action: () => navigate('/settings/users') },
      // events page
      { key: 'e+e', action: () => navigate('/events') },
    ],
    [navigate],
  )

  const navBar = useMemo(
    () => [
      { key: '1', action: () => dispatch(toggleMenuOpen('project')) },
      { key: '8', action: () => dispatch(toggleMenuOpen('help')) },
      { key: '9+9', action: () => logout() },
      { key: '9', action: () => dispatch(toggleMenuOpen('user')) },
      { key: '0', action: () => dispatch(toggleMenuOpen('app')) },
    ],
    [navigate],
  )
  // when these variables change, update shortcutshh
  const deps = []

  const defaultShortcuts = [...navigation, ...navBar]

  // start off with global shortcuts but others can be set per page
  const [shortcuts, setShortcuts] = useState(defaultShortcuts)

  // update shortcuts when these variables change
  useEffect(() => {
    setShortcuts(defaultShortcuts)
  }, deps)

  const handleKeyPress = (e) => {
    // check target isn't an input
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || disabled) return
    // or has blocked shortcuts className
    if (e.target.classList.contains('block-shortcuts')) return
    // or any of its parents
    if (e.target.closest('.block-shortcuts')) return

    let singleKey = e.key
    // add ctrl_ prefix if ctrl or cmd is pressed
    if (e.ctrlKey || e.metaKey) singleKey = 'ctrl+' + singleKey
    // support alt
    if (e.altKey) singleKey = 'alt+' + singleKey

    const combo = lastPressed + '+' + singleKey
    // first check if the key pressed is a shortcut
    // const shortcut = shortcuts[e.key] || shortcuts[combo]
    const shortcut = shortcuts.find((s) => s.key === combo || s.key === singleKey)

    setLastPressed(singleKey)

    if (!shortcut) return

    if (!shortcut.action || shortcut.disabled) return
    // console.log(shortcut)

    // if it is, prevent default browser behavior
    e.preventDefault()

    // check if the shortcut has a closest selector
    if (shortcut.closest) {
      // if it does, check if the target matches the selector
      if (!hovered || !hovered.closest(shortcut.closest)) return
    }

    // and run the action
    shortcut.action(hovered)
  }

  // listen for key presses
  useKeyPress(handleKeyPress, [])

  // create function that can be used in components to add shortcuts, when the component mounts
  // and removes them when it unmounts
  const addShortcuts = (newShortcuts) => {
    setShortcuts((oldShortcuts) => {
      const oldShortcutsFiltered = oldShortcuts.filter(
        (s) => !newShortcuts.some((n) => n.key === s.key),
      )
      return [...oldShortcutsFiltered, ...newShortcuts]
    })
  }

  const removeShortcuts = (shortcutsToRemove) => {
    // console.log('removing shortcuts', shortcutsToRemove)
    setShortcuts((oldShortcuts) => oldShortcuts.filter((s) => !shortcutsToRemove.includes(s.key)))
  }

  return (
    <ShortcutsContext.Provider
      value={{
        addShortcuts,
        removeShortcuts,
        disableShortcuts: () => setDisabled(true),
        enableShortcuts: () => setDisabled(false),
      }}
    >
      {props.children}
    </ShortcutsContext.Provider>
  )
}

function useShortcutsContext() {
  return useContext(ShortcutsContext)
}

export { ShortcutsProvider, useShortcutsContext }
