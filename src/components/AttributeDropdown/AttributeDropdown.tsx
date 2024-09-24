import { Icon } from '@ynput/ayon-react-components'
import { useState } from 'react'
import * as Styled from './AttributeDropdown.styled'
import AttributeDropdownItem from './AttributeDropdownItem'
import { DndContext } from '@dnd-kit/core'

export type AttributeData = {
  isExpanded: boolean
  label: string
  value: string
  color?: string
  icon?: string
  isIconEnabled: boolean
  isColorEnabled: boolean
}
type Foo = keyof AttributeData

const AttributeDropdown = () => {
const newItem: AttributeData = {
  isExpanded: true,
  label: 'testing',
  value: 'testing_value',
  isIconEnabled: true,
  isColorEnabled: true,
}
  const getInitialAttributes = () => [{ ...newItem }]
  const [items, setItems] = useState<AttributeData[]>(getInitialAttributes())

  const handleAddItem = () => {
    setItems([...items, {...newItem}])
  }
  const handleRemoveItem = (idx: number) => () => {
    setItems([...items.slice(0, idx), ...items.slice(idx+ 1)])
  }

  const handleToggleExpandedItem = (idx: number) => {
    setItems([...items.slice(0, idx +1), items[idx], ...items.slice(idx+ 1)])
  }

  const onChange = (idx: number) => (attr: Foo, value: boolean | string | undefined) => {
    let updatedItem: AttributeData = {...items[idx] }
    // @ts-ignore
    updatedItem[attr] = value
    setItems([...items.slice(0, idx), updatedItem, ...items.slice(idx+ 1)])
  }

  return (
    <Styled.AttributeDropdownWrapper>
      {items.map((item, idx) => (
        <AttributeDropdownItem
          key={`AttributeDropdown_${idx}`}
          item={item}
          onChange={onChange(idx)}
          onRemove={handleRemoveItem(idx)}
          onDuplicate={() => handleToggleExpandedItem(idx)}
          />
      ))}

      <Styled.ActionWrapper style={{justifyContent: 'end'}} onClick={handleAddItem}>
        <Icon icon="add" />
        Add new item
      </Styled.ActionWrapper>
    </Styled.AttributeDropdownWrapper>
  )
}

export default AttributeDropdown