import { openViewer } from '@state/viewer'
import { $Any } from '@types'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'

export const useOpenTaskInViewer = () => {
  const dispatch = useDispatch()

  return (task: $Any) => {
    const { id, projectName } = task

    if (id && projectName) {
      dispatch(openViewer({ taskId: id, projectName, quickView: true }))
    } else {
      toast.info('Task has no versions to view.')
    }
  }
}

export default useOpenTaskInViewer
