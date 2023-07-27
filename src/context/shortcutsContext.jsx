import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import useKeyPress from '../hooks/useKeyPress'
import { useNavigate } from 'react-router'
import { useDispatch, useSelector } from 'react-redux'
import { setProjectMenuOpen, setUserMenuOpen } from '../features/context'

const ShortcutsContext = createContext()

function ShortcutsProvider(props) {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const projectMenuOpen = useSelector((state) => state.context.projectMenuOpen)
  const userMenuOpen = useSelector((state) => state.context.userMenuOpen)
  // keep track of the last key pressed
  const [lastPressed, setLastPressed] = useState(null)

  // last key pressed should be reset after 200ms
  useEffect(() => {
    const timer = setTimeout(() => setLastPressed(null), 400)
    return () => clearTimeout(timer)
  }, [lastPressed])

  const settings = useMemo(
    () => [
      { key: 's+s', action: () => navigate('/settings/studio') },
      { key: 's+b', action: () => navigate('/settings/bundles') },
      { key: 's+u', action: () => navigate('/settings/users') },
      { key: 's+a', action: () => navigate('/settings/attributes') },
      { key: 's+p', action: () => navigate('/settings/anatomyPresets') },
    ],
    [navigate],
  )

  // dashboard, teams, anatomy, projectSettings

  const manageProjects = useMemo(
    () => [
      { key: 'm+m', action: () => navigate('/manageProjects/dashboard') },
      { key: 'm+t', action: () => navigate('/manageProjects/teams') },
      { key: 'm+a', action: () => navigate('/manageProjects/anatomy') },
      { key: 'm+s', action: () => navigate('/manageProjects/projectSettings') },
    ],
    [navigate],
  )

  const globalActions = [
    {
      key: 'ctrl+p',
      action: () => dispatch(setProjectMenuOpen(!projectMenuOpen)),
    },
    {
      key: 'ctrl+m',
      action: () => dispatch(setUserMenuOpen(!userMenuOpen)),
    },
  ]
  // when these variables change, update shortcuts
  const deps = [projectMenuOpen, userMenuOpen]

  const defaultShortcuts = [...settings, ...manageProjects, ...globalActions]

  // start off with global shortcuts but others can be set per page
  const [shortcuts, setShortcuts] = useState(defaultShortcuts)

  // update shortcuts when these variables change
  useEffect(() => {
    setShortcuts(defaultShortcuts)
  }, deps)

  const handleKeyPress = (e) => {
    // check target isn't an input
    if (e.target.tagName === 'INPUT') return

    let singleKey = e.key
    // add ctrl_ prefix if ctrl or cmd is pressed
    if (e.ctrlKey || e.metaKey) singleKey = 'ctrl+' + singleKey

    const combo = lastPressed + '+' + singleKey
    // first check if the key pressed is a shortcut
    // const shortcut = shortcuts[e.key] || shortcuts[combo]
    const shortcut = shortcuts.find((s) => s.key === combo || s.key === singleKey)

    setLastPressed(singleKey)

    if (!shortcut?.action) return
    // console.log(shortcut)

    // if it is, prevent default browser behavior
    e.preventDefault()

    // and run the action
    shortcut.action()
  }

  // listen for key presses
  useKeyPress(handleKeyPress, [projectMenuOpen])

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
