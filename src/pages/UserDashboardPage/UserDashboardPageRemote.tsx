// A wrapper component for remote Studio pages

import { RemotePageWrapper, RemotePageWrapperProps } from '@shared/components'
import { FC } from 'react'

export interface UserDashboardPageRemoteProps extends Omit<RemotePageWrapperProps, 'projectName'> {
  viewType?: string
}

export const UserDashboardPageRemote: FC<UserDashboardPageRemoteProps> = ({
  Component,
  viewType,
  state = {},
}) => {
  return <RemotePageWrapper {...{ Component, viewType }} state={state} />
}
