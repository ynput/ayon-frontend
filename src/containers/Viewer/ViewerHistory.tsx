import { UseDrawHistory } from '@context/viewerContext'
import { useAppDispatch, useAppSelector } from '@state/store'
import { clearAnnotation } from '@state/viewer'
import { FC, useEffect } from 'react'

interface ViewerHistoryProps {
  useHistory: UseDrawHistory
}

const ViewerHistory: FC<ViewerHistoryProps> = ({ useHistory }) => {
  const dispatch = useAppDispatch()
  const { clear, history } = useHistory()

  const clearingAnnotation = useAppSelector((state) => state.viewer.clearAnnotation)
  //   clearAnnotation when redux state changes
  useEffect(() => {
    if (!clearingAnnotation) return

    clear(clearingAnnotation)
    // reset redux
    dispatch(clearAnnotation(null))
  }, [clearingAnnotation, clear, dispatch])

  return null
}

export default ViewerHistory
