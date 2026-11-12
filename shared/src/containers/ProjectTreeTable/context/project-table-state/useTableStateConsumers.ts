import { useContributions } from '@ynput/ayon-addon'

/** Whether an addon reads `tableState`; pages skip building it (and walking the folder tree) otherwise. */
export const useTableStateConsumers = () => {
  const toolbar = useContributions('projectTable.toolbarItem').contributions.length
  const columnMenu = useContributions('projectTable.columnMenuItem').contributions.length
  const entityMenu = useContributions('entityMenuItem').contributions.length
  const shortcuts = useContributions('table.shortcut').contributions.length
  return !!(toolbar || columnMenu || entityMenu || shortcuts)
}
