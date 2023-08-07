import React from 'react'
import * as Styled from './ReleasePreset.styled'
import { Icon } from '@ynput/ayon-react-components'
import { format, formatDistanceToNow } from 'date-fns'

const ReleasePreset = ({
  addons,
  label,
  bio,
  icon,
  name,
  createdAt,
  isSelected,
  onClick,
  ...props
}) => {
  const [showExactDate, setShowExactDate] = React.useState(false)

  const handleClick = () => {
    setShowExactDate(!showExactDate)
  }

  const fuzzyDate = React.useMemo(() => {
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

  return (
    <Styled.Preset
      $selected={isSelected}
      onClick={onClick}
      {...props}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <Styled.Header>
        <Icon icon={icon} />
        <div>
          <h3>{label}</h3>
          <span>{bio}</span>
        </div>
      </Styled.Header>
      {isSelected && <Styled.Addons>Addons: {addons.join(', ')}</Styled.Addons>}
      {isSelected && (
        <Styled.Addons>
          Release: Ynput - {name} - <span onClick={handleClick}>{fuzzyDate}</span>
        </Styled.Addons>
      )}
    </Styled.Preset>
  )
}

export default ReleasePreset
