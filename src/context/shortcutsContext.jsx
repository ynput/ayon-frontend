import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useDispatch } from 'react-redux'
import { toggleMenuOpen } from '../features/context'
import { useLogOutMutation } from '../services/auth/getAuth'
import { useSearchParams } from 'react-router-dom'

const ShortcutsContext = createContext()

function ShortcutsProvider(props) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const dispatch = useDispatch()

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
      {
        key: 'p+p',
        action: () => navigate('/manageProjects/projectSettings?' + searchParams.toString()),
      },
      // project settings anatomy
      { key: 'a+a', action: () => navigate('/manageProjects/anatomy?' + searchParams.toString()) },
      // studio settings
      { key: 's+s', action: () => navigate('/settings/studio') },
      // bundles settings
      { key: 'b+b', action: () => navigate('/settings/bundles') },
      // dashboard
      { key: 'd+d', action: () => navigate('/dashboard') },
      // user settings
      { key: 'u+u', action: () => navigate('/settings/users') },
      // events page
      { key: 'e+e', action: () => navigate('/events') },
    ],
    [navigate, searchParams],
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
  const deps = [searchParams]

  const defaultShortcuts = [...navigation, ...navBar]

  // keep track of what's being hovered
  const [hovered, setHovered] = useState(null)
  // start off with global shortcuts but others can be set per page
  const [shortcuts, setShortcuts] = useState(defaultShortcuts)

  // update shortcuts when these variables change
  useEffect(() => {
    setShortcuts(defaultShortcuts)
  }, deps)

  const handleKeyPress = useCallback(
    (e) => {
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

      // check if the key is part of a complex shortcut
      const keyPartOfCombo = shortcuts.some((s) => s.key.includes(singleKey))

      if (!keyPartOfCombo) return

      setLastPressed(singleKey)

      if (!shortcut) return

      if (!shortcut.action || shortcut.disabled) return
      // console.log(shortcut)

      // if it is, prevent default browser behavior
      e.preventDefault()

      // check if the shortcut has a closest selector
      if (shortcut.closest) {
        // if it does, check if the target matches the selector
        if (!hovered?.target || !hovered?.target?.closest(shortcut.closest)) return
      }

      // and run the action
      shortcut.action(hovered)
    },
    [lastPressed, shortcuts, hovered, disabled],
  )

  // Add event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [handleKeyPress])

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

  const removeEventListener = () =>
    document.removeEventListener('mouseover', (e) => {
      setHovered(e)
    })

  useEffect(() => {
    if (shortcuts.some((s) => s.closest)) {
      document.addEventListener('mouseover', (e) => {
        setHovered(e)
      })
    } else {
      removeEventListener()
    }

    return () => removeEventListener()
  }, [shortcuts])

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
