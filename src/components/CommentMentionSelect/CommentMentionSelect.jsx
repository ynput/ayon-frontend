import * as Styled from './CommentMentionSelect.styled'
import { Icon, UserImage } from '@ynput/ayon-react-components'
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

  // check if any of the options have the same label
  const labels = options.map((option) => option.label)
  const hasSameLabel = new Set(labels).size < labels.length
  let formattedOptions = [...options]
  if (hasSameLabel) {
    // add context value as a suffix to the label
    formattedOptions = options.map((option) => {
      return {
        ...option,
        label: option.label + (option.context ? ` (${option.context})` : ''),
      }
    })
  }

  return (
    <Styled.MentionSelect tabIndex={0}>
      {types.includes(mention.type) &&
        formattedOptions.map((option, i) => (
          <Styled.MentionItem
            key={option.id + '-' + i}
            id={option.id}
            onClick={() => onChange(option)}
            $isCircle={config?.isCircle}
            className={classNames({ selected: selectedIndex === i })}
          >
            {option.type === 'user' ? (
              <UserImage size={20} src={option.image} name={option.label} className="image" />
            ) : (
              <Icon icon={option.icon} size={20} className="image" />
            )}

            <Styled.MentionName>{option.label}</Styled.MentionName>
          </Styled.MentionItem>
        ))}
      {noneFoundAtAll && <Styled.MentionItem>No {config.id}s found</Styled.MentionItem>}
    </Styled.MentionSelect>
  )
}

export default CommentMentionSelect
