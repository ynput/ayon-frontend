import React from 'react'
import * as Styled from './ReleasePreset.styled'
import { Icon } from '@ynput/ayon-react-components'
import { format, formatDistanceToNow } from 'date-fns'
import Type from '/src/theme/typography.module.css'

const ReleasePreset = ({
  addons,
  label,
  bio,
  icon,
  name,
  createdAt,
  isSelected,
  onClick,
  isLoading,
  index,
  ...props
}) => {
  const [showExactDate, setShowExactDate] = React.useState(false)

  const handleClick = () => {
    setShowExactDate(!showExactDate)
  }

  const fuzzyDate = React.useMemo(() => {
    if (!createdAt) return ''
    const date = new Date(createdAt)
    if (showExactDate) {
      return format(date, 'dd-MM-yy HH:mm')
    } else {
      return formatDistanceToNow(date, { addSuffix: true })
    }
  }, [createdAt, showExactDate])

  const handleKeyDown = (e) => {
    // if enter then trigger on click if value
    if (e.key === 'Enter') {
      onClick()
    }
  }

  isSelected = isSelected || (isLoading && index === 0)

  return (
    <Styled.Preset
      $selected={isSelected}
      $loading={isLoading}
      onClick={onClick}
      {...props}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <Styled.Header>
        <Icon icon={icon} />
        <div>
          <h3 className={Type.titleLarge}>{label || name}</h3>
          <span className={Type.titleSmall}>{bio}</span>
        </div>
      </Styled.Header>
      {isSelected && (
        <Styled.Addons className={Type.bodySmall}>Addons: {addons?.join(', ')}</Styled.Addons>
      )}
      {isSelected && (
        <Styled.Addons className={Type.bodySmall}>
          Release: Ynput - {name} - <span onClick={handleClick}>{fuzzyDate}</span>
        </Styled.Addons>
      )}
    </Styled.Preset>
  )
}

export default ReleasePreset
