import { useEffect } from 'react'

const usePreviewShortcuts = ({ allVersions = {}, onChange, toolsRef, selectRef }) => {
  const handleShortcut = (action) => {
    const version = allVersions[action]

    if (!version) return

    if (version.id) onChange(version.id)

    // highlight button briefly
    const buttonEl = toolsRef.current.querySelector(`#${action}-${version.id}`)
    if (!buttonEl) return

    buttonEl.classList.add('highlight')

    setTimeout(() => {
      buttonEl.classList.remove('highlight')
    }, 150)
  }

  const openSelectDropdown = () => {
    const options = selectRef.current.getOptions()
    if (!options) selectRef.current?.open()
    else selectRef.current?.close()

    // focus on the dropdown
    const el = selectRef.current?.getElement()
    const buttonEl = el?.querySelector('button')
    if (buttonEl) buttonEl.focus()
  }

  const shortcuts = [
    {
      key: 'z', //select previous version
      action: () => handleShortcut('previous'),
    },
    {
      key: 'x', //select any version (dropdown)
      action: () => openSelectDropdown(),
    },
    {
      key: 'c', //select next version
      action: () => handleShortcut('next'),
    },
    {
      key: 'C', //select latest version
      action: () => handleShortcut('latest'),
    },
    {
      key: 'X', //select approved version
      action: () => handleShortcut('approved'),
    },
    {
      key: 'H', //select hero version
      action: () => handleShortcut('hero'),
    },
  ]

  useEffect(() => {
    const handleKeyDown = (e) => {
      // abort if modifier keys are pressed
      if (e.ctrlKey || e.altKey || e.metaKey) return

      // check shortcut isn't inside an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      // check shortcut isn't inside a contenteditable element
      if (e.target.isContentEditable) return

      const shortcut = shortcuts.find((s) => s.key === e.key)
      if (shortcut) {
        shortcut.action()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    // Cleanup function to remove the event listener when the component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcuts])
}

export default usePreviewShortcuts
