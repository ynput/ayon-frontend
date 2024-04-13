import React from 'react'
import * as Styled from './ActivityHeader.styled'
import UserImage from '/src/components/UserImage'

import ActivityReference from '../ActivityReference/ActivityReference'
import ActivityDate from '../ActivityDate'

const ActivityHeader = ({ name, fullName, date, isRef, activity = {}, onDelete, children }) => {
  const { referenceType, origin = {} } = activity
  const isMention = referenceType === 'mention'

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
              {isMention ? `this ${origin?.type} in` : 'on'}
            </Styled.Text>
            <ActivityReference id={origin?.id} type={origin?.type} disabled>
              {origin?.label || origin?.name}
            </ActivityReference>
          </>
        )}

        {/* custom children, like status change */}
        {children}

        <Styled.Tools className="tools">
          {onDelete && (
            <Styled.ToolButton
              icon="delete"
              variant="danger"
              className="delete"
              onClick={onDelete}
            />
          )}
        </Styled.Tools>
      </Styled.Body>
      <ActivityDate date={date} />
    </Styled.Header>
  )
}

export default ActivityHeader
