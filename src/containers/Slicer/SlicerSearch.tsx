import { HeaderButton } from '@shared/SimpleTable'
import { InputText } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { useState } from 'react'
import styled from 'styled-components'

const StyledContainer = styled.div``

const StyledInput = styled(InputText)`
  position: absolute;
  inset: 4px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  height: 28px;
  min-height: 28px;
`

type Props = {
  value: string
  onChange: (value: string) => void
}

const SlicerSearch = ({ value, onChange }: Props) => {
  const [isOpen, setIsOpen] = useState(false)

  const onToggle = () => {
    setIsOpen(!isOpen)
    // clear value if closing
    if (isOpen) {
      onChange('')
    }
  }

  const handleInputKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      onChange('')
    }
  }

  return (
    <StyledContainer>
      {isOpen && (
        <StyledInput
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search"
          autoFocus
          onKeyDown={handleInputKeydown}
        />
      )}
      <HeaderButton
        icon={isOpen ? 'close' : 'search'}
        onClick={onToggle}
        className={clsx({ open: isOpen })}
        data-tooltip={isOpen ? 'Close search' : 'Search folders'}
      />
    </StyledContainer>
  )
}

export default SlicerSearch
