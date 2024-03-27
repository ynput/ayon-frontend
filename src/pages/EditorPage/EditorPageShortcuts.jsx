import useShortcuts from '/src/hooks/useShortcuts'

const EditorPageShortcuts = ({ setNewEntity, disableAddNew, handleToggleFolder }) => {
  const shortcuts = [
    {
      key: 'n',
      action: () => setNewEntity('folder'),
    },
    {
      key: 'm',
      action: () => setNewEntity('sequence'),
    },
    {
      key: 't',
      action: () => setNewEntity('task'),
      disabled: disableAddNew,
    },
    {
      key: 'c',
      action: (e) => handleToggleFolder(e, true),
      closest: 'tr.type-folder',
    },
  ]

  useShortcuts(shortcuts, [disableAddNew, handleToggleFolder])
  return null
}

export default EditorPageShortcuts
