import { FC } from 'react'
import * as Styled from './ReviewableUploadCard.styled'
import { Button, getFileSizeString, Icon } from '@ynput/ayon-react-components'
import { classNames } from 'primereact/utils'

export interface ReviewableUploadFile {
  name: string
  size?: number
  progress?: number // 0 - 100
  type: 'upload' | 'processing' | 'unsupported'
  error?: string
}

interface ReviewableUploadCardProps extends ReviewableUploadFile {
  onRemove?: () => void
}

const ReviewableUploadCard: FC<ReviewableUploadCardProps> = ({
  name,
  progress,
  size,
  type,
  error,
  onRemove,
}) => {
  let message = '',
    isSpinning = false,
    icon = ''
  switch (type) {
    case 'processing':
      message = 'Transcoding'
      isSpinning = true
      icon = 'settings'
      break
    case 'unsupported':
      message = 'Unsupported file - conversion required'
      icon = 'visibility_off'
      break
    case 'upload':
      message = 'Uploading'
      isSpinning = true
      icon = 'sync'
      break
    default:
      break
  }

  const progressString = progress !== undefined ? `- ${progress}%` : ''
  const finished = progress === 100
  return (
    <Styled.UploadCard key={name} className={classNames({ finished, error: !!error })}>
      <Styled.Type>
        {icon && (
          <Icon icon={error ? 'error' : icon} className={classNames({ spinning: isSpinning })} />
        )}
      </Styled.Type>

      <span className="content">
        <span className="name">{name}</span>
        <span className="message">{error ? error : `${message} ${progressString}`}</span>
      </span>
      {size && <span className="size">{getFileSizeString(size)}</span>}
      {error && <Button icon="close" variant="danger" onClick={onRemove} />}
      <Styled.ProgressBar className="progress" style={{ right: `${100 - (progress ?? 0)}%` }} />
    </Styled.UploadCard>
  )
}

export default ReviewableUploadCard
