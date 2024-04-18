import React, { useRef } from 'react'
import * as Styled from './ActivityHeader.styled'
import UserImage from '/src/components/UserImage'
import ActivityReference from '../ActivityReference/ActivityReference'
import ActivityDate from '../ActivityDate'
import MenuContainer from '/src/components/Menu/MenuComponents/MenuContainer'
import ActivityCommentMenu from '../ActivityCommentMenu/ActivityCommentMenu'
import { toggleMenuOpen } from '/src/features/context'
import { useDispatch } from 'react-redux'

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
  projectInfo,
  projectName,
  entityType,
  onReferenceClick,
}) => {
  const { referenceType, origin = {}, isOwner } = activity
  const isMention = referenceType === 'mention'

  // open menu
  const dispatch = useDispatch()
  const handleToggleMenu = (menu) => dispatch(toggleMenuOpen(menu))
  const moreRef = useRef()

  return (
    <Styled.Header>
      <Styled.Body>
        {name && <UserImage name={name} size={22} />}
        <h5>{fullName}</h5>
        {isRef && (
          <>
            <Styled.Text>
              <strong>{isMention ? `mentioned` : 'commented'}</strong>
            </Styled.Text>
            <Styled.Text style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isMention ? `this ${entityType} in` : 'on'}
            </Styled.Text>
            <ActivityReference
              id={origin?.id}
              type={origin?.type}
              projectName={projectName}
              variant="text"
              projectInfo={projectInfo}
              onClick={() =>
                onReferenceClick({ entityId: origin?.id, entityType: origin?.type, projectName })
              }
            >
              {origin?.label || origin?.name}
            </ActivityReference>
          </>
        )}

        {/* custom children, like status change */}
        {children}

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

        <MenuContainer id={id} target={moreRef.current}>
          <ActivityCommentMenu onDelete={() => isOwner && onDelete()} />
        </MenuContainer>
      </Styled.Body>
      <ActivityDate date={date} />
    </Styled.Header>
  )
}

export default ActivityHeader
