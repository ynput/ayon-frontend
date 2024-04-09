import { formatDistanceToNow, isValid } from 'date-fns'
import * as Styled from './ActivityCommentRef.styled'
import { Spacer, UserImage } from '@ynput/ayon-react-components'
import FeedReference from '../../ActivityReference/ActivityReference'
import Typography from '/src/theme/typography.module.css'

const ActivityCommentRef = ({ activity = {}, entityType = '' }) => {
  const { createdAt, referenceType } = activity
  // user details
  const { authorName, authorFullName, authorAvatarUrl } = activity
  // origin entity details
  const { id: originId, name, label, type: originType } = activity.origin || {}

  const isMention = referenceType === 'mention'
  console.log(activity)

  const fuzzyDate =
    createdAt && isValid(new Date(createdAt))
      ? formatDistanceToNow(new Date(createdAt), { addSuffix: true })
      : ''

  return (
    <Styled.Reference>
      <UserImage fullName={authorFullName} src={authorAvatarUrl} name={authorName} size={22} />
      <Styled.Text>{authorFullName || authorName}</Styled.Text>
      <Styled.Text>
        <strong>{isMention ? `mentioned` : 'commented'}</strong>
      </Styled.Text>
      <Styled.Text>{isMention ? `this ${entityType} in` : 'on'}</Styled.Text>
      <FeedReference id={originId} type={originType} label={label || name} disabled>
        {label || name}
      </FeedReference>
      <Spacer />
      <Styled.Text className={Typography.bodySmall}>{fuzzyDate}</Styled.Text>
    </Styled.Reference>
  )
}

export default ActivityCommentRef
