// A wrapper component for remote Studio pages

import { RemotePageWrapper, RemotePageWrapperProps } from '@shared/components'
import { useDetailsPanelContext } from '@shared/context'
import { useAppDispatch, useAppSelector } from '@state/store'
import { FC } from 'react'

export interface UserDashboardPageRemoteProps extends Omit<RemotePageWrapperProps, 'projectName'> {
  viewType?: string
}

export const UserDashboardPageRemote: FC<UserDashboardPageRemoteProps> = ({
  Component,
  viewType,
  state = {},
  ...props
}) => {
  const dispatch = useAppDispatch()
  const useSelector = useAppSelector
  const { onOpenImage, onGoToFrame, onOpenViewer, onUpdateEntity } = useDetailsPanelContext()

  return (
    <RemotePageWrapper
      {...{ Component, viewType }}
      {...props}
      dispatch={dispatch}
      useSelector={useSelector}
      onOpenImage={onOpenImage}
      onGoToFrame={onGoToFrame}
      onOpenViewer={onOpenViewer}
      onUpdateEntity={onUpdateEntity}
      state={state}
    />
  )
}
