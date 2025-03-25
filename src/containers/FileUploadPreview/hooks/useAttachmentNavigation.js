import { onCommentImageActivityAndIndexChange, onCommentImageIndexChange } from '@state/context'
import { useDispatch } from 'react-redux'

const useAttachmentNavigation = ({ files, index, activityId }) => {
  const dispatch = useDispatch()

  const _attachments = files
  const _index = index
  const _activityId = activityId

  const canNavigateUp = () => _attachments[0].id != _activityId
  const canNavigateDown = () => _attachments[_attachments.length - 1].id != _activityId
  const canNavigateLeft = () => _index > 0 || canNavigateUp()
  const canNavigateRight = () =>
    _index < _attachments.find((att) => att.id == _activityId).files.length - 1 || canNavigateDown()
  const getPreviousActivity = () =>
    _attachments[_attachments.findIndex((el) => el.id == _activityId) - 1]
  const getNextActivity = () =>
    _attachments[_attachments.findIndex((el) => el.id == _activityId) + 1]
  const getPreviousActivityId = () => getPreviousActivity().id
  const getNextActivityId = () => getNextActivity().id

  const getByIndexActivity = (activityId, index) => {
    if (!activityId === null || index == null) {
      return { id: null, projectName: null, mime: null, extension: null }
    }
    const activity = _attachments.find((att) => att.id == activityId)
    return activity.files[index]
  }

  const navigateUp = () => {
    dispatch(
      onCommentImageActivityAndIndexChange({ activityId: getPreviousActivityId(), index: 0 }),
    )
  }
  const navigateDown = () =>
    dispatch(onCommentImageActivityAndIndexChange({ activityId: getNextActivityId(), index: 0 }))

  const navigateLeft = () => {
    if (_index > 0) {
      return dispatch(onCommentImageIndexChange({ delta: -1 }))
    }

    const prevActivity = getPreviousActivity()
    dispatch(
      onCommentImageActivityAndIndexChange({
        activityId: prevActivity.id,
        index: prevActivity.files.length - 1,
      }),
    )
  }

  const navigateRight = () => {
    if (_index < _attachments.find((file) => file.id == _activityId).files.length - 1) {
      return dispatch(onCommentImageIndexChange({ delta: 1 }))
    }

    dispatch(onCommentImageActivityAndIndexChange({ activityId: getNextActivityId(), index: 0 }))
  }

  return {
    canNavigateDown,
    canNavigateUp,
    canNavigateLeft,
    canNavigateRight,
    getPreviousActivity,
    getNextActivityId,
    getByIndexActivity,
    navigateUp,
    navigateDown,
    navigateLeft,
    navigateRight,
  }
}
export default useAttachmentNavigation
