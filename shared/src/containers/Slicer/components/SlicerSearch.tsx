import { HeaderButton } from '@shared/containers/SimpleTable/SimpleTable.styled'
import { InputText } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import styled from 'styled-components'

const StyledContainer = styled.div`
  display: flex;
  align-items: center;

  &.open {
    flex: 1;
    min-width: 0;
  }
`

const StyledInput = styled(InputText)`
  flex: 1;
  min-width: 0;
  height: 28px;
  min-height: 28px;
`

type Props = {
  open: boolean
  value: string
  // what the panel lists, for the tooltip: 'Folders', 'Task Type', ...
  subject: string
  onChange: (value: string | undefined) => void
}

const SlicerSearch = ({ open, value, subject, onChange }: Props) => {
  const onToggle = () => onChange(open ? undefined : '')

  const handleInputKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') onChange(undefined)
  }

  return (
    <StyledContainer className={clsx({ open })}>
      {open && (
        <StyledInput
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search"
          autoFocus
          onKeyDown={handleInputKeydown}
        />
      )}
      <HeaderButton
        icon={open ? 'close' : 'search'}
        onClick={onToggle}
        className={clsx({ open })}
        data-tooltip={open ? 'Close search' : `Search ${subject}`}
      />
    </StyledContainer>
  )
}

export default SlicerSearch
