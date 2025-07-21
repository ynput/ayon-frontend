import { SearchEntityLink } from '@shared/api'
import { SimpleTableRow } from '@shared/SimpleTable'

export const buildEntityPickerTableData = (data: SearchEntityLink[]): SimpleTableRow[] => {
  return data.map((entity) => ({
    id: entity.id,
    name: entity.name,
    label: entity.label || entity.name,
    path: entity.path,
    subRows: [],
    data: {
      id: entity.id,
      name: entity.name,
      label: entity.label || entity.name,
      entityType: entity.entityType,
    },
  }))
}
