import { openViewer } from '@state/viewer'
import { $Any } from '@types'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'

export const useOpenTaskInViewer = () => {
  const dispatch = useDispatch()

  return (task: $Any) => {
    const {
      lastVersionWithReviewableVersionId: versionId,
      lastVersionWithReviewableProductId: productId,
      projectName,
    } = task

    if (versionId && productId && projectName) {
      dispatch(openViewer({ versionIds: [versionId], productId, projectName, quickView: true }))
    } else {
      toast.info('Task has no versions to view.')
    }
  }
}

export default useOpenTaskInViewer
