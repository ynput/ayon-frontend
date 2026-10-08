import { ROW_ID_SEPARATOR } from '../../hooks/useBuildGroupByTableData'

// kept out of ProjectTableContextInstance: this import closes a cycle back to the provider,
// and a context module inside a cycle gets re-created on hot updates
export const parseRowId = (rowId: string) => rowId?.split(ROW_ID_SEPARATOR)[0] || rowId
