import { FC } from 'react'
import EmptyPlaceholder from '@components/EmptyPlaceholder/EmptyPlaceholder'

interface ReleaseInstallerErrorProps {
  error: any
}

export const ReleaseInstallerError: FC<ReleaseInstallerErrorProps> = ({ error }) => {
  return (
    <EmptyPlaceholder
      icon="error"
      message="No releases"
      error={'No releases found: ' + JSON.stringify(error)}
      style={{ position: 'relative', top: 0, left: 0, transform: 'none' }}
    />
  )
}
