import React, { useState } from 'react'
import * as Styled from './CommentMentionSelect.styled'
import { UserImage } from '@ynput/ayon-react-components'

const CommentMentionSelect = ({ mention, options = [], onChange }) => {
  if (!mention) return null

  const [hasHovered, setHasHovered] = useState(false)

  return (
    <Styled.MentionSelect
      tabIndex={0}
      onMouseEnter={() => setHasHovered(true)}
      $hasHovered={hasHovered}
    >
      {mention.type === '@' &&
        options.map((option) => (
          <Styled.MentionItem key={option.id} onClick={() => onChange(option)}>
            <UserImage size={20} src={option.image} fullName={option.label} />
            <Styled.MentionName>{option.label}</Styled.MentionName>
          </Styled.MentionItem>
        ))}
    </Styled.MentionSelect>
  )
}

export default CommentMentionSelect
