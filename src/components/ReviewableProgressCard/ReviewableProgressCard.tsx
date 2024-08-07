import { FC, HTMLProps } from 'react'
import * as Styled from './ReviewableProgressCard.styled'
import { Button, getFileSizeString, Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'

export interface ReviewableProgress {
  name: string
  size?: number
  fileId?: string
  progress?: number // 0 - 100
  error?: string
  src?: string
}

interface ReviewableProgressCardProps
  extends ReviewableProgress,
    Omit<HTMLProps<HTMLDivElement>, 'name' | 'children' | 'as' | 'ref'> {
  onRemove?: () => void
  tooltip?: string
  type: 'upload' | 'processing' | 'unsupported' | 'queued'
}

const ReviewableProgressCard: FC<ReviewableProgressCardProps> = ({
  name,
  progress,
  size,
  type,
  fileId,
  src,
  error,
  tooltip,
  onRemove,
  ...props
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
      message = 'Unsupported - conversion required'
      icon = 'visibility_off'
      break
    case 'upload':
      message = 'Uploading'
      isSpinning = true
      icon = 'sync'
      break
    case 'queued':
      message = 'Queued - waiting to be transcoded'
      icon = 'hourglass'
      break
    default:
      break
  }

  if (error) {
    isSpinning = false
    icon = 'error'
  }

  const progressString = progress !== undefined ? `- ${progress}%` : ''
  const finished = progress === 100
  return (
    <Styled.UploadCard
      key={name}
      className={clsx({ finished, error: !!error, [type]: true })}
      id={fileId}
      {...props}
    >
      <Styled.Type>
        {src && <img src={src} />}
        {icon && <Icon icon={icon} className={clsx({ spinning: isSpinning })} />}
      </Styled.Type>

      <span className="content">
        <span className="name">{name}</span>
        <span className="message">{error ? error : `${message} ${progressString}`}</span>
      </span>
      {size && <span className="size">{getFileSizeString(size)}</span>}
      {tooltip && (
        <Icon icon="info" className="info" data-tooltip={tooltip} data-tooltip-as="markdown" />
      )}
      {error && <Button icon="close" variant="danger" onClick={onRemove} />}
      <Styled.ProgressBar className="progress" style={{ right: `${100 - (progress ?? 0)}%` }} />
    </Styled.UploadCard>
  )
}

export default ReviewableProgressCard
