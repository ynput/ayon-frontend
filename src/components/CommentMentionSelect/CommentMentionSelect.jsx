import React, { useState } from 'react'
import * as Styled from './CommentMentionSelect.styled'
import { UserImage } from '@ynput/ayon-react-components'

const CommentMentionSelect = ({
  mention,
  options = [],
  onChange,
  types = [],
  config = {},
  noneFound,
  noneFoundAtAll,
}) => {
  if (!mention || noneFound) return null

  const [hasHovered, setHasHovered] = useState(false)

  //  show only 5 options
  const shownOptions = options.filter((_, i) => i < 5)

  return (
    <Styled.MentionSelect
      tabIndex={0}
      onMouseEnter={() => setHasHovered(true)}
      $hasHovered={hasHovered}
    >
      {types.includes(mention.type) &&
        shownOptions.map((option) => (
          <Styled.MentionItem
            key={option.id}
            onClick={() => onChange(option)}
            $isCircle={config?.isCircle}
          >
            <UserImage size={20} src={option.image} fullName={option.label} className="image" />
            <Styled.MentionName>{option.label}</Styled.MentionName>
          </Styled.MentionItem>
        ))}
      {noneFoundAtAll && <Styled.MentionItem>No {config.id}s found</Styled.MentionItem>}
    </Styled.MentionSelect>
  )
}

export default CommentMentionSelect
