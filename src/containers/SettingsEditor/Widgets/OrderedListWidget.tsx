import { useMemo, useState } from 'react'
import { Button, Dropdown, DropdownProps } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import OrderSelectionDialog from './OrderSelectionDialog'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  max-width: 800px;
`

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const StyledDropdown = styled(Dropdown)`
  flex: 1;
  button > div > div:has(span) {
    width: 0;
  }
`

const SectionLabel = styled.div`
  font-size: 11px;
  color: var(--md-sys-color-outline);
  padding: 6px 8px 2px;
`

export interface OrderedListWidgetProps {
  value: string[]
  options: { label: string; value: string }[]
  onChange: (value: string[]) => void
  placeholder?: string
  disabled?: boolean
  dropdownProps?: Partial<DropdownProps>
}

const OrderedListWidget = ({
  value,
  options,
  onChange,
  placeholder = 'Select applications',
  disabled,
  dropdownProps,
}: OrderedListWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelectionChange = (newSelection: string[]) => {
    // Preserve order of already-selected items, append new ones at end
    const kept = value.filter((v) => newSelection.includes(v))
    const added = newSelection.filter((v) => !value.includes(v))
    onChange([...kept, ...added])
  }

  const handleSelectAll = () => {
    const all = options.map((o) => o.value)
    const kept = value.filter((v) => all.includes(v))
    const added = all.filter((v) => !value.includes(v))
    onChange([...kept, ...added])
  }

  const handleClear = () => {
    onChange([])
  }

  // Selected items first in their selection order, then the rest in enum order
  const orderedOptions = useMemo(() => {
    const byValue = new Map(options.map((o) => [o.value, o]))
    const selected = value
      .map((v) => byValue.get(v))
      .filter((o): o is { label: string; value: string } => Boolean(o))
    const rest = options.filter((o) => !value.includes(o.value))
    return [...selected, ...rest]
  }, [value, options])

  const onDialogSubmit = (newOrder: string[] | null) => {
    if (newOrder !== null) onChange(newOrder)
    setIsOpen(false)
  }

  return (
    <Container data-tooltip="">
      <Row>
        <StyledDropdown
          widthExpand
          options={orderedOptions}
          value={value}
          onSelectionChange={handleSelectionChange}
          multiSelect
          placeholder={placeholder}
          disabled={disabled}
          search={options.length > 10}
          onSelectAll={options.length > 10 ? handleSelectAll : undefined}
          onClear={value.length > 0 ? handleClear : undefined}
          clearTooltip="Clear selection"
          {...dropdownProps}
        />
        <Button
          icon="sort"
          label="Set order"
          onClick={() => setIsOpen(true)}
          disabled={disabled || value.length < 2}
        />
      </Row>

      {options.length === 0 && <SectionLabel>No options available</SectionLabel>}

      {isOpen && (
        <OrderSelectionDialog value={value} options={options} onSubmit={onDialogSubmit} />
      )}
    </Container>
  )
}

export default OrderedListWidget
