import { HeaderButton } from '@shared/containers/SimpleTable/SimpleTable.styled'
import { InputText } from '@ynput/ayon-react-components'
import { pastedListToSearch } from '@shared/util'
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

  // Same as the main filter bar: a pasted column or row becomes a comma (OR) list.
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const normalized = pastedListToSearch(e.clipboardData.getData('text'))
    if (normalized === null) return
    e.preventDefault()

    const input = e.currentTarget
    const start = input.selectionStart ?? value.length
    const end = input.selectionEnd ?? value.length
    const caret = start + normalized.length
    onChange(value.slice(0, start) + normalized + value.slice(end))
    requestAnimationFrame(() => input.setSelectionRange(caret, caret))
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
          onPaste={handlePaste}
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
