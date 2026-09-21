import { FC } from 'react'
import EmptyPlaceholder from '@shared/components/EmptyPlaceholder'
import { Button } from '@ynput/ayon-react-components'
import { getRequestErrorString } from '@shared/util'

interface ReleaseInstallerErrorProps {
  error: any
  onClose: () => void
}

export const ReleaseInstallerError: FC<ReleaseInstallerErrorProps> = ({ error, onClose }) => {
  return (
    <>
      <EmptyPlaceholder
        icon="error"
        message="No releases"
        error={`No releases found: ${getRequestErrorString(error)}`}
        style={{
          position: 'relative',
          maxWidth: '100%',
          overflow: 'hidden',
          top: 0,
          left: 0,
          transform: 'none',
        }}
        pt={{
          error: {
            style: {
              overflow: 'auto',
              width: '100%',
            },
          },
        }}
      />
      <Button onClick={onClose}>Close</Button>
    </>
  )
}
