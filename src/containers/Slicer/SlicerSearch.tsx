import { Button, InputText } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { useState } from 'react'
import styled from 'styled-components'

const StyledContainer = styled.div``

const StyledButton = styled(Button)`
  background-color: unset;
  z-index: 110;
  position: relative;

  &.open {
    background-color: unset !important;
  }
`

const StyledInput = styled(InputText)`
  position: absolute;
  inset: 4px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
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
      <StyledButton
        icon={isOpen ? 'close' : 'search'}
        onClick={onToggle}
        className={clsx({ open: isOpen })}
      />
    </StyledContainer>
  )
}

export default SlicerSearch
