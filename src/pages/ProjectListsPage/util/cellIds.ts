import { getCellId } from "@shared/containers"
import { EntityListItemWithLinks } from "../hooks/useGetListItemsData"

export const getCellIdForColumn = (rows: EntityListItemWithLinks[], id: string, column: string) => {
  const row = rows.find(({ entityId }) => entityId === id)
  if (!row) return null

  return getCellId(row.id, column)
}
