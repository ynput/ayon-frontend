import * as Styled from './CommentMentionSelect.styled'
import { Icon } from '@ynput/ayon-react-components'
import UserImage from '@components/UserImage'
import clsx from 'clsx'
import { upperFirst } from 'lodash'

const CommentMentionSelect = ({
  mention,
  options = [],
  selectedIndex,
  onChange,
  types = [],
  config = {},
  noneFound,
  noneFoundAtAll,
  error,
}) => {
  if (!mention || noneFound) return null

  // const hasSameLabel = new Set(labels).size < labels.length
  let formattedOptions = [...options]

  // add context value as a suffix to the label
  formattedOptions = options.map((option) => {
    return {
      ...option,
      label: option.label,
    }
  })

  let noOptionsString = `No ${config.id}s found`
  if (error) noOptionsString = error

  return (
    <>
      <Styled.MentionSelect tabIndex={0}>
        <Styled.Title>
          {mention.type} {upperFirst(config?.id)}s
        </Styled.Title>
        {types.includes(mention.type) &&
          formattedOptions.map((option, i) => (
            <Styled.MentionItem
              key={option.id + '-' + i}
              id={option.id}
              onClick={() => onChange(option)}
              $isCircle={config?.isCircle}
              className={clsx({ selected: selectedIndex === i })}
            >
              {option.type === 'user' ? (
                <UserImage size={20} name={option.id} className="image" />
              ) : (
                <Icon icon={option.icon} size={20} className="image" />
              )}
              {option.context && <Styled.MentionPrefix>{option.context} - </Styled.MentionPrefix>}
              <Styled.MentionName>{option.label}</Styled.MentionName>
              {option.suffix && <Styled.MentionSuffix>{option.suffix}</Styled.MentionSuffix>}
            </Styled.MentionItem>
          ))}
        {(noneFoundAtAll || error) && <Styled.MentionItem>{noOptionsString}</Styled.MentionItem>}
      </Styled.MentionSelect>
    </>
  )
}

export default CommentMentionSelect
