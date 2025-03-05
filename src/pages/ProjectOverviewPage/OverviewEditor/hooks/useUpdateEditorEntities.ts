import { useAppSelector } from '@state/store'
import { CellId } from '../utils/cellUtils'
import { CellValue } from '../Cells/EditorCell'
import { OperationModel } from '@api/rest/operations'
import { useOperationsMutation } from '@queries/overview/updateOverview'
import { toast } from 'react-toastify'

export type EntityUpdate = {
  id: string
  type: string
  field: string
  value: CellValue | CellValue[]
  isAttrib?: boolean
}
export type UpdateTableEntities = (entities: EntityUpdate[]) => Promise<void>

export type UpdateTableEntity = (
  cellId: CellId,
  value: string,
  { includeSelection }: { includeSelection: boolean },
) => Promise<void>

const useUpdateEditorEntities = () => {
  const projectName = useAppSelector((state) => state.project.name)
  const [postOperations] = useOperationsMutation()

  const updateEntities: UpdateTableEntities = async (entities = []) => {
    if (!entities.length || !projectName) {
      return
    }

    const supportedEntityTypes: OperationModel['entityType'][] = ['task', 'folder']
    // Group operations by entity type for bulk processing
    let operations: OperationModel[] = []
    for (const entity of entities) {
      // Skip unsupported entity types
      let entityType = entity.type as OperationModel['entityType']
      if (!supportedEntityTypes.includes(entityType)) {
        continue
      }

      // create data object for change, taking into account if it's an attribute change
      const data = entity.isAttrib
        ? { attrib: { [entity.field]: entity.value } }
        : { [entity.field]: entity.value }

      const existingOperationIndex = operations.findIndex(
        (op) => op.entityId === entity.id && op.entityType === entityType,
      )

      if (existingOperationIndex !== -1) {
        // Merge data with existing operation
        const existingOperation = operations[existingOperationIndex]
        let newData = { ...existingOperation.data, ...data }

        // @ts-expect-error
        if (existingOperation.data?.attrib && data.attrib) {
          // @ts-expect-error
          newData = { ...newData, attrib: { ...existingOperation.data.attrib, ...data.attrib } }
        }

        operations[existingOperationIndex] = {
          ...existingOperation,
          data: newData,
        }
      } else {
        // Add new operation
        operations.push({
          entityType: entityType,
          entityId: entity.id,
          type: 'update',
          data: data,
        })
      }
    }

    // now make api call to update all entities
    try {
      await postOperations({ operationsRequestModel: { operations }, projectName }).unwrap()
    } catch (error) {
      toast.error('Failed to update entities')
    }
  }

  return { updateEntities }
}

export default useUpdateEditorEntities
