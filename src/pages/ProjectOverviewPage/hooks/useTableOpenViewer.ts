import { ProjectTableProviderProps } from '@shared/containers'
import { useAppDispatch } from '@state/store'
import { openViewer, ViewerState } from '@state/viewer'
import { useCallback } from 'react'

export interface TableOpenViewerProps {
  projectName: string
}

const useTableOpenViewer = ({ projectName }: TableOpenViewerProps) => {
  const dispatch = useAppDispatch()

  const openPlayer = useCallback<NonNullable<ProjectTableProviderProps['onOpenPlayer']>>(
    (targetIds, config) => {
      const payload: Partial<ViewerState> = {
        projectName,
        quickView: config?.quickView ?? false,
      }

      if (targetIds.versionId) {
        payload.versionIds = [targetIds.versionId]
        payload.selectedProductId = targetIds.productId
        payload.folderId = targetIds.folderId
      } else if (targetIds.taskId) {
        payload.taskId = targetIds.taskId
      } else if (targetIds.folderId) {
        payload.folderId = targetIds.folderId
      } else if (targetIds.productId) {
        payload.productId = targetIds.productId
      }

      // check if payload has no ids set
      if (
        !payload.folderId &&
        !payload.taskId &&
        !payload.productId &&
        !payload.versionIds?.length
      ) {
        console.warn('No valid targetIds provided to openViewer')
        return
      }

      console.log(`Opening viewer with payload:`, payload)

      dispatch(openViewer(payload))
    },
    [dispatch, projectName], // Ensure openPlayer is memoized,
  )

  return openPlayer
}

export default useTableOpenViewer
