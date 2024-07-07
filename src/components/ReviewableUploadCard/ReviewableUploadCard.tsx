import { FC } from 'react'
import * as Styled from './ReviewableUploadCard.styled'
import { Button, getFileSizeString, Icon } from '@ynput/ayon-react-components'
import { classNames } from 'primereact/utils'

export interface ReviewableUploadFile {
  name: string
  size: number
  progress: number // 0 - 100
  error?: string
}

interface ReviewableUploadCardProps extends ReviewableUploadFile {
  onRemove: () => void
}

const ReviewableUploadCard: FC<ReviewableUploadCardProps> = ({
  name,
  progress,
  size,
  error,
  onRemove,
}) => {
  const finished = progress === 100
  return (
    <Styled.UploadCard key={name} className={classNames({ finished, error: !!error })}>
      <Icon icon={error ? 'error' : finished ? 'check_circle' : 'sync'} />
      <span className="content">
        <span className="name">{name}</span>
        <span className="message">
          {error ? error : finished ? 'Upload complete' : `Uploading - ${progress}%`}
        </span>
      </span>
      <span className="size">{getFileSizeString(size)}</span>
      {error && <Button icon="close" variant="danger" onClick={onRemove} />}
      <Styled.ProgressBar className="progress" style={{ right: `${100 - progress}%` }} />
    </Styled.UploadCard>
  )
}

export default ReviewableUploadCard
