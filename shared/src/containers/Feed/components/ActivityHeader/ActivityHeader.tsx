import React, { useMemo } from 'react'
import * as Styled from './ActivityHeader.styled'
import ActivityReference from '../ActivityReference/ActivityReference'
import ActivityDate from '../ActivityDate'
import { Icon, UserImage } from '@ynput/ayon-react-components'
import { RefTooltip } from '../../context/FeedContext'
import { ANONYMOUS_GUEST_NAME_PREFIX } from '../ActivityVersionReview/ActivityVersionReview'

interface Origin {
  id: string
  type: string
  label: string
  name: string
}

export interface ActivityHeaderProps {
  name?: string
  fullName?: string
  date?: string
  isRef?: boolean
  activity?: {
    referenceType?: string
    origin?: Origin
    activityType?: string
    versions?: any[]
    activityId?: string
    author?: {
      deleted?: boolean
      active?: boolean
    }
    activityData?: {
      author?: string
    }
  }
  children?: React.ReactNode
  projectName?: string
  entityType?: string
  onReferenceClick?: (args: {
    entityId?: string
    entityType?: string
    projectName?: string
    activityId?: string
  }) => void
  onReferenceTooltip?: (args: RefTooltip) => void
}

const ActivityHeader: React.FC<ActivityHeaderProps> = ({
  name,
  fullName,
  date,
  isRef,
  activity = {},
  children,
  projectName,
  entityType,
  onReferenceClick,
  onReferenceTooltip,
}) => {
  const { referenceType, origin, activityType, versions, activityId } = activity
  const isMention = referenceType === 'mention'

  const isPublish = activityType === 'version.publish'
  const isMultipleVersions = versions && versions?.length > 1
  const publishedString = isMultipleVersions ? 'published versions' : 'published a version'

  const boldString = isMention ? `mentioned` : 'commented'
  const entityTypeString = isMention ? ` ${entityType} on` : 'on'

  const isGuest = name?.startsWith('guest.') || name?.startsWith(ANONYMOUS_GUEST_NAME_PREFIX)
  const noUser = (activity.author?.deleted || !activity.author?.active) && !isGuest

  const userImageSrc = useMemo(() => {
    if (name?.startsWith(ANONYMOUS_GUEST_NAME_PREFIX)) {
      return
    }

    return `/api/users/${name}/avatar`
  }, [name])

  return (
    <Styled.Header>
      <Styled.Body>
        {name && !noUser && <UserImage
          name={name}
          fullName={fullName}
          src={userImageSrc}
          size={22}
        />}
        {noUser && <Icon icon="account_circle" />}
        <h5>{fullName || activity.activityData?.author || 'Unknown'}</h5>
        {isRef && (
          <>
            <Styled.Text>
              <strong>{boldString}</strong>
            </Styled.Text>
            <Styled.Text style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {entityTypeString}
            </Styled.Text>
            {origin && (
              <ActivityReference
                id={origin.id}
                type={origin.type}
                variant="text"
                onClick={() =>
                  onReferenceClick?.({
                    entityId: origin.id,
                    entityType: origin.type,
                    projectName,
                    activityId,
                  })
                }
                onMouseEnter={(_e, pos: any) =>
                  onReferenceTooltip?.({
                    type: origin.type,
                    id: origin.id,
                    label: origin.label,
                    name: origin.id,
                    pos,
                  })
                }
              >
                {origin.label || origin.name}
              </ActivityReference>
            )}
          </>
        )}
        {isPublish && <Styled.Text>{publishedString}</Styled.Text>}

        {/* custom children, like status change */}
        {children}
      </Styled.Body>
      <ActivityDate date={date} />
    </Styled.Header>
  )
}

export default ActivityHeader
