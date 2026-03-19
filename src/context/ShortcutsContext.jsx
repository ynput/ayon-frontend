import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@state/store'
import { useMenuContext } from '@shared/context/MenuContext'
import { useLogoutMutation } from '@queries/auth/logout'
import { useSearchParams } from 'react-router-dom'

const ShortcutsContext = createContext()

function ShortcutsProvider(props) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const { toggleMenuOpen } = useMenuContext()

  // review open
  const reviewOpen = useAppSelector((state) => state.viewer.isOpen)

  // logout
  const [logout] = useLogoutMutation()

  // keep track of the last key pressed
  const [lastPressed, setLastPressed] = useState(null)
  // disable shortcuts
  const [disabled, setDisabled] = useState([])
  // allow shortcuts
  const [allowed, setAllowed] = useState([])

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
      { key: 'h+h', action: () => navigate('/dashboard') },
      // user settings
      { key: 'u+u', action: () => navigate('/settings/users') },
      // events page
      { key: 'e+e', action: () => navigate('/events') },
      // services page
      { key: 'v+v', action: () => navigate('/services') },
      // market page
      { key: 'm+m', action: () => navigate('/market') },
      // inbox page
      { key: 'i+i', action: () => navigate('/inbox/important') },
    ],
    [navigate, searchParams],
  )

  const navBar = useMemo(
    () => [
      { key: '1', action: () => toggleMenuOpen('project') },
      { key: '8', action: () => toggleMenuOpen('help') },
      { key: '9', action: () => toggleMenuOpen('app') },
      { key: '0+0', action: () => logout() },
      { key: '0', action: () => toggleMenuOpen('user') },
    ],
    [toggleMenuOpen, logout],
  )

  const defaultShortcuts = [...navigation, ...navBar]

  // Separate global shortcuts from component shortcuts
  const globalShortcuts = useMemo(() => defaultShortcuts, [defaultShortcuts, navigation, navBar])
  const [componentShortcuts, setComponentShortcuts] = useState(new Map())

  // Compute active shortcuts by combining global and component shortcuts
  const activeShortcuts = useMemo(() => {
    const allShortcuts = [...globalShortcuts]
    componentShortcuts.forEach((shortcuts) => {
      allShortcuts.push(...shortcuts)
    })
    return allShortcuts
  }, [globalShortcuts, componentShortcuts])

  // keep track of what's being hovered
  const [hovered, setHovered] = useState(null)
  // start off with global shortcuts but others can be set per page
  const shortcutsRef = useRef(activeShortcuts)

  // Update ref whenever shortcuts change
  useEffect(() => {
    shortcutsRef.current = activeShortcuts
  }, [activeShortcuts])

  const handleKeyPress = useCallback(
    (e) => {
      // check target isn't an input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return
      // or has blocked shortcuts className
      if (e.target.classList.contains('block-shortcuts')) return
      // or any of its parents
      if (e.target.closest('.block-shortcuts')) return
      // if review is open, don't allow shortcuts
      if (reviewOpen) return

      let singleKey = e.key
      const isMeta = e.metaKey || e.ctrlKey
      // add ctrl_ prefix if ctrl or cmd is pressed
      if (isMeta) singleKey = 'ctrl+' + singleKey
      // support alt
      if (e.altKey) singleKey = 'alt+' + singleKey

      const combo = lastPressed + '+' + singleKey

      // check if combo is currently disabled or not in allowed list
      const isDisabled = disabled.includes(combo) || disabled.includes(singleKey)
      const isAllowed = !allowed.length || allowed.includes(combo) || allowed.includes(singleKey)

      if (isDisabled || !isAllowed) return

      // first check if the key pressed is a shortcut
      // const shortcut = shortcuts[e.key] || shortcuts[combo]
      const shortcut = activeShortcuts.find((s) => s.key === combo || s.key === singleKey)

      // check if the key is part of a complex shortcut
      const keyPartOfCombo = activeShortcuts.some((s) => s.key.includes(singleKey))

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
      shortcut.action(hovered, isMeta, e)
    },
    [lastPressed, activeShortcuts, hovered, disabled, allowed, reviewOpen],
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
  const addShortcuts = useCallback((id, newShortcuts) => {
    setComponentShortcuts((current) => {
      const updated = new Map(current)
      updated.set(id, newShortcuts)
      return updated
    })
  }, [])

  const removeShortcuts = useCallback((id) => {
    setComponentShortcuts((current) => {
      const updated = new Map(current)
      updated.delete(id)
      return updated
    })
  }, [])

  const removeEventListener = () =>
    document.removeEventListener('mouseover', (e) => {
      setHovered(e)
    })

  useEffect(() => {
    if (activeShortcuts.some((s) => s.closest)) {
      document.addEventListener('mouseover', (e) => {
        setHovered(e)
      })
    } else {
      removeEventListener()
    }

    return () => removeEventListener()
  }, [activeShortcuts])

  return (
    <ShortcutsContext.Provider
      value={{
        addShortcuts,
        removeShortcuts,
        setDisabled,
        setAllowed,
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
