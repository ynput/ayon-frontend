import { useCallback } from 'react'
import { ProjectPatchModel, useUpdateProjectMutation } from '@shared/api'
import { getErrorMessage } from '@shared/util'
import { ListTableCellCallbacks } from '@shared/containers/ListTable/ListTableCell'
import { ProjectTableRow } from './useProjectTableRows'

const ATTRIBUTE_COLUMN_PREFIX = 'attrib_'
const ATTRIBUTE_COLUMN_SUFFIX = '_attrib'

const EDITABLE_PROJECT_FIELDS = ['label', 'code', 'active', 'library'] as const

type EditableProjectField = (typeof EDITABLE_PROJECT_FIELDS)[number]

const isEditableProjectField = (columnId: string): columnId is EditableProjectField =>
  EDITABLE_PROJECT_FIELDS.includes(columnId as EditableProjectField)

const getAttribKeyFromColumnId = (columnId: string) => {
  if (columnId.startsWith(ATTRIBUTE_COLUMN_PREFIX)) {
    return columnId.slice(ATTRIBUTE_COLUMN_PREFIX.length)
  }

  if (columnId.endsWith(ATTRIBUTE_COLUMN_SUFFIX)) {
    return columnId.slice(0, -ATTRIBUTE_COLUMN_SUFFIX.length)
  }

  return null
}

export const useUpdateProjectTableRow =
  (): ListTableCellCallbacks<ProjectTableRow>['onUpdateRow'] => {
    const [updateProject] = useUpdateProjectMutation()

    return useCallback(
      (columnId, value, rowId) => {
        const projectName = rowId
        if (!projectName) {
          return
        }

        const attribKey = getAttribKeyFromColumnId(columnId)

        let projectPatchModel: ProjectPatchModel | null = null

        if (attribKey) {
          projectPatchModel = {
            attrib: {
              [attribKey]: value,
            },
          }
        } else if (isEditableProjectField(columnId)) {
          projectPatchModel = {
            [columnId]: value,
          }
        }

        if (!projectPatchModel) {
          return
        }

        void updateProject({ projectName, projectPatchModel })
          .unwrap()
          .catch((error) => {
            getErrorMessage(error, `Failed to update project ${projectName}`)
          })
      },
      [updateProject],
    )
  }
