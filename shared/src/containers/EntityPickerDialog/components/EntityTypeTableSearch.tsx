import { HeaderButton } from '@shared/SimpleTable'
import { InputText } from '@ynput/ayon-react-components'
import { FC } from 'react'
import styled from 'styled-components'

const Container = styled.div`
  position: relative;
  width: 100%;
  padding: 4px;

  input {
    width: 100%;
  }
`

const CloseButton = styled(HeaderButton)`
  position: absolute;
  top: 50%;
  right: 6px;
  transform: translateY(-50%);
`

interface EntityTypeTableSearchProps {
  value: string
  onChange: (value: string) => void
  onClose: () => void
}

const EntityTypeTableSearch: FC<EntityTypeTableSearchProps> = ({ value, onChange, onClose }) => {
  return (
    <Container>
      <InputText
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose()
          }
        }}
      />
      <CloseButton icon="close" variant="text" onClick={onClose} />
    </Container>
  )
}

export default EntityTypeTableSearch
