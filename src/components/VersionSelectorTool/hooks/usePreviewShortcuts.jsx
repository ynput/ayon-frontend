import Shortcuts from '/src/containers/Shortcuts'

const usePreviewShortcuts = ({ allVersions = {}, onChange, toolsRef }) => {
  const handleShortcut = (action) => {
    const version = allVersions[action]
    if (version?.id) onChange(version.id)

    // highlight button briefly
    const buttonEl = toolsRef.current.querySelector(`#${action}-${version.id}`)
    if (!buttonEl) return

    buttonEl.classList.add('highlight')

    setTimeout(() => {
      buttonEl.classList.remove('highlight')
    }, 150)
  }

  const shortcuts = [
    {
      key: 'z', //select previous version
      action: () => handleShortcut('previous'),
    },
    {
      key: 'c', //select next version
      action: () => handleShortcut('next'),
    },
    {
      key: 'v', //select latest version
      action: () => handleShortcut('latest'),
    },
    {
      key: 'b', //select approved version
      action: () => handleShortcut('approved'),
    },
    {
      key: 'n', //select approved version
      action: () => handleShortcut('hero'),
    },
  ]

  return <Shortcuts shortcuts={shortcuts} deps={[allVersions.selected]} />
}

export default usePreviewShortcuts
