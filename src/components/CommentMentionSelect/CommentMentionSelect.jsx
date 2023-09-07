import React, { useState } from 'react'
import * as Styled from './CommentMentionSelect.styled'
import { UserImage } from '@ynput/ayon-react-components'

const CommentMentionSelect = ({ mention, options = [], onChange, types = [], config = {} }) => {
  if (!mention) return null

  const [hasHovered, setHasHovered] = useState(false)

  return (
    <Styled.MentionSelect
      tabIndex={0}
      onMouseEnter={() => setHasHovered(true)}
      $hasHovered={hasHovered}
    >
      {types.includes(mention.type) &&
        options.flatMap((option, i) =>
          i > 5 ? (
            []
          ) : (
            <Styled.MentionItem
              key={option.id}
              onClick={() => onChange(option)}
              $isCircle={config?.isCircle}
            >
              <UserImage size={20} src={option.image} fullName={option.label} className="image" />
              <Styled.MentionName>{option.label}</Styled.MentionName>
            </Styled.MentionItem>
          ),
        )}
    </Styled.MentionSelect>
  )
}

export default CommentMentionSelect
