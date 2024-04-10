import * as Styled from './CommentMentionSelect.styled'
import { UserImage } from '@ynput/ayon-react-components'
import { classNames } from 'primereact/utils'

const CommentMentionSelect = ({
  mention,
  options = [],
  selectedIndex,
  onChange,
  types = [],
  config = {},
  noneFound,
  noneFoundAtAll,
}) => {
  if (!mention || noneFound) return null

  return (
    <Styled.MentionSelect tabIndex={0}>
      {types.includes(mention.type) &&
        options.map((option, i) => (
          <Styled.MentionItem
            key={option.id}
            onClick={() => onChange(option)}
            $isCircle={config?.isCircle}
            className={classNames({ selected: selectedIndex === i })}
          >
            <UserImage size={20} src={option.image} name={option.label} className="image" />
            <Styled.MentionName>{option.label}</Styled.MentionName>
          </Styled.MentionItem>
        ))}
      {noneFoundAtAll && <Styled.MentionItem>No {config.id}s found</Styled.MentionItem>}
    </Styled.MentionSelect>
  )
}

export default CommentMentionSelect
