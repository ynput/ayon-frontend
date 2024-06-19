import React, { useRef } from 'react'
import * as Styled from './ActivityHeader.styled'
import UserImage from '@components/UserImage'
import ActivityReference from '../ActivityReference/ActivityReference'
import ActivityDate from '../ActivityDate'
import MenuContainer from '@components/Menu/MenuComponents/MenuContainer'
import ActivityCommentMenu from '../ActivityCommentMenu/ActivityCommentMenu'
import { toggleMenuOpen } from '@state/context'
import { useDispatch } from 'react-redux'
import { Icon } from '@ynput/ayon-react-components'

const ActivityHeader = ({
  name,
  fullName,
  date,
  isRef,
  activity = {},
  onDelete,
  onEdit,
  children,
  id,
  projectName,
  entityType,
  onReferenceClick,
  onReferenceTooltip,
}) => {
  const { referenceType, origin = {}, isOwner, activityType, versions = [], activityId } = activity
  const isMention = referenceType === 'mention'

  const isPublish = activityType === 'version.publish'
  const isMultipleVersions = versions.length > 1
  const publishedString = isMultipleVersions ? 'published versions' : 'published a version'

  const boldString = isMention ? `mentioned` : 'commented'
  const entityTypeString = isMention ? ` ${entityType} on` : 'on'

  // open menu
  const dispatch = useDispatch()
  const handleToggleMenu = (menu) => dispatch(toggleMenuOpen(menu))
  const moreRef = useRef()

  const noUser = activity.author?.deleted || !activity.author?.active
  return (
    <Styled.Header>
      <Styled.Body>
        {name && !noUser && <UserImage name={name} size={22} />}
        {noUser && <Icon icon="no_accounts" />}
        <h5>{fullName || activity.activityData?.author || 'Unknown'}</h5>
        {isRef && (
          <>
            <Styled.Text>
              <strong>{boldString}</strong>
            </Styled.Text>
            <Styled.Text style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {entityTypeString}
            </Styled.Text>
            <ActivityReference
              id={origin?.id}
              type={origin?.type}
              variant="text"
              onClick={() =>
                onReferenceClick({
                  entityId: origin?.id,
                  entityType: origin?.type,
                  projectName,
                  activityId,
                })
              }
              onMouseEnter={(e, pos) =>
                onReferenceTooltip({
                  type: origin?.type,
                  id: origin?.id,
                  label: origin?.label,
                  name: origin?.id,
                  pos,
                })
              }
            >
              {origin?.label || origin?.name}
            </ActivityReference>
          </>
        )}
        {isPublish && <Styled.Text>{publishedString}</Styled.Text>}

        {/* custom children, like status change */}
        {children}
        {!isPublish && (
          <Styled.Tools className={'tools'} ref={moreRef}>
            {isOwner && onEdit && (
              <Styled.ToolButton icon="edit_square" variant="text" onClick={onEdit} />
            )}
            {isOwner && (
              <Styled.ToolButton
                icon="more_horiz"
                variant="text"
                className="more"
                onClick={() => handleToggleMenu(id)}
              />
            )}
          </Styled.Tools>
        )}

        <MenuContainer id={id} target={moreRef.current}>
          <ActivityCommentMenu onDelete={() => isOwner && onDelete()} />
        </MenuContainer>
      </Styled.Body>
      <ActivityDate date={date} />
    </Styled.Header>
  )
}

export default ActivityHeader
