import { HeaderButton } from '@shared/containers/SimpleTable/SimpleTable.styled'
import { InputText } from '@ynput/ayon-react-components'
import { pastedListToSearch } from '@shared/util'
import { FC } from 'react'
import styled from 'styled-components'

const Container = styled.div`
  position: relative;
  width: 100%;
  padding: 4px;

  input {
    width: 100%;
    min-width: 0;
  }
`

const CloseButton = styled(HeaderButton)`
  position: absolute;
  top: 50%;
  right: 6px;
  transform: translateY(-50%);
`

export interface TableSearchProps {
  value: string
  onChange: (value: string) => void
  onClose: () => void
  className?: string
  /**
   * a pasted spreadsheet column or row, or one name per line, becomes a comma (OR) list, for a
   * table whose search reads commas that way (SimpleTable's)
   */
  pasteList?: boolean
}

export const TableSearch: FC<TableSearchProps> = ({
  value,
  onChange,
  onClose,
  className,
  pasteList,
}) => {
  // single-line inputs drop new lines on paste, so it has to happen in the paste handler
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
    <Container className={className}>
      <InputText
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={pasteList ? handlePaste : undefined}
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
