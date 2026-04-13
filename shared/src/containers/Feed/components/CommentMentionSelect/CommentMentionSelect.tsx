import * as Styled from './CommentMentionSelect.styled'
import { Icon } from '@ynput/ayon-react-components'
import UserImage from '../../../../components/UserImage'
import clsx from 'clsx'

interface CommentMentionSelectProps {
  mention: { type: string; search?: string } | null
  options?: {
    id: string
    label: string
    type: string
    icon?: string
    color?: string
    context?: string
    suffix?: string
  }[]
  selectedIndex: number | null
  onChange: (option: { id: string; label: string }) => void
  onPrefixFilter?: (prefix: string) => void
  activePrefix?: string
  types?: string[]
  config: { id?: string; isCircle?: boolean }
  noneFound?: boolean
  noneFoundAtAll?: boolean
  error?: string
  isGuest?: boolean
}

const CommentMentionSelect = ({
  mention,
  options = [],
  selectedIndex,
  onChange,
  onPrefixFilter,
  activePrefix,
  types = [],
  config = {},
  noneFound,
  noneFoundAtAll,
  error,
  isGuest,
}: CommentMentionSelectProps) => {
  if (!mention || noneFound) return null

  if (isGuest)
    return (
      <Styled.MentionSelect tabIndex={0}>
        <Styled.MentionItem>Mentions not supported for guest users</Styled.MentionItem>
      </Styled.MentionSelect>
    )

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

  const isUserMention = mention.type === '@'
  const titleText = isUserMention
    ? '@ Users & Teams'
    : `${mention.type} ${config?.id ? config.id.charAt(0).toUpperCase() + config.id.slice(1) : ''}s`

  return (
    <>
      <Styled.MentionSelect tabIndex={0}>
        <Styled.Title>
          <span>{titleText}</span>
          {isUserMention && (
            <Styled.PrefixFilters>
              <Styled.PrefixButton
                className={clsx({ active: activePrefix === 'user' })}
                onClick={() => onPrefixFilter?.(activePrefix === 'user' ? '' : 'user:')}
                title="Filter users"
              >
                <Icon icon="person" />
              </Styled.PrefixButton>
              <Styled.PrefixButton
                className={clsx({ active: activePrefix === 'team' })}
                onClick={() => onPrefixFilter?.(activePrefix === 'team' ? '' : 'team:')}
                title="Filter teams"
              >
                <Icon icon="group" />
              </Styled.PrefixButton>
            </Styled.PrefixFilters>
          )}
        </Styled.Title>
        {types.includes(mention.type) &&
          formattedOptions.map((option, i) => (
            <Styled.MentionItem
              key={option.id + '-' + i}
              id={option.id}
              onClick={() => onChange(option)}
              className={clsx({ selected: selectedIndex === i, square: !config?.isCircle })}
            >
              {option.type === 'user' ? (
                <UserImage size={20} name={option.id} className="image" />
              ) : (
                option.icon && (
                  <Icon icon={option.icon} className="image" style={{ color: option.color }} />
                )
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
