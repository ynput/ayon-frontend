import React, { createContext, useContext, useEffect, useState } from 'react'
import useKeyPress from '../hooks/useKeyPress'
import { useNavigate } from 'react-router'

const ShortcutsContext = createContext()

function ShortcutsProvider(props) {
  const navigate = useNavigate()
  // keep track of the last key pressed
  const [lastPressed, setLastPressed] = useState(null)

  // last key pressed should be reset after 200ms
  useEffect(() => {
    const timer = setTimeout(() => setLastPressed(null), 400)
    return () => clearTimeout(timer)
  }, [lastPressed])

  const settings = [
    { key: 's_s', action: () => navigate('/settings/studio') },
    { key: 's_b', action: () => navigate('/settings/bundles') },
    { key: 's_u', action: () => navigate('/settings/users') },
    { key: 's_a', action: () => navigate('/settings/attributes') },
    { key: 's_p', action: () => navigate('/settings/anatomyPresets') },
  ]

  // dashboard, teams, anatomy, projectSettings

  const manageProjects = [
    { key: 'm_m', action: () => navigate('/manageProjects/dashboard') },
    { key: 'm_t', action: () => navigate('/manageProjects/teams') },
    { key: 'm_a', action: () => navigate('/manageProjects/anatomy') },
    { key: 'm_s', action: () => navigate('/manageProjects/projectSettings') },
  ]

  const defaultShortcuts = [...settings, ...manageProjects]

  // start off with global shortcuts but others can be set per page
  const [shortcuts, setShortcuts] = useState(defaultShortcuts)

  // create function that can be used in components to add shortcuts, when the component mounts
  // and removes them when it unmounts
  const addShortcuts = (newShortcuts) => {
    // console.log('adding shortcuts', newShortcuts)
    setShortcuts((oldShortcuts) => [...oldShortcuts, ...newShortcuts])
  }

  const removeShortcuts = (shortcutsToRemove) => {
    // console.log('removing shortcuts', shortcutsToRemove)
    setShortcuts((oldShortcuts) => oldShortcuts.filter((s) => !shortcutsToRemove.includes(s.key)))
  }

  const handleKeyPress = (e) => {
    // check target isn't an input
    if (e.target.tagName === 'INPUT') return

    let singleKey = e.key
    // add ctrl_ prefix if ctrl or cmd is pressed
    if (e.ctrlKey || e.metaKey) singleKey = 'ctrl_' + singleKey

    const combo = lastPressed + '_' + singleKey
    // first check if the key pressed is a shortcut
    // const shortcut = shortcuts[e.key] || shortcuts[combo]
    const shortcut = shortcuts.find((s) => s.key === combo || s.key === singleKey)

    setLastPressed(singleKey)

    if (!shortcut?.action) return
    // console.log(shortcut.key)

    // if it is, prevent default browser behavior
    e.preventDefault()

    // and run the action
    shortcut.action()
  }

  // listen for key presses
  useKeyPress(handleKeyPress)

  return (
    <ShortcutsContext.Provider
      value={{
        addShortcuts,
        removeShortcuts,
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
