import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { uniqueId } from 'lodash'
import { DndContext } from '@dnd-kit/core'
import { Icon } from '@ynput/ayon-react-components'
import useDraggableList from './hooks/useDraggableList'
import * as Styled from './AttributeDropdown.styled'
import AttributeDropdownItem from './AttributeDropdownItem'

export type AttributeData = {
  id: string,
  isExpanded: boolean
  label: string
  value: string
  color?: string
  icon?: string
  isIconEnabled: boolean
  isColorEnabled: boolean
}

const newItem = (): AttributeData => ({
  id: uniqueId(),
  isExpanded: true,
  label: 'testing',
  value: 'testing_value',
  isIconEnabled: true,
  isColorEnabled: true,
})

const AttributeDropdown = () => {
  const {
    items,
    handleAddItem,
    handleRemoveItem,
    handleChangeItem,
    handleDuplicateItem,
    handleDraggableEnd,
  } = useDraggableList<AttributeData>({creator: newItem, initialData: [] })

  return (
    <>
      <Styled.AttributeDropdownWrapper>
        <DndContext onDragEnd={handleDraggableEnd}>

        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {items.map((item, idx) => (
            <AttributeDropdownItem
              key={`AttributeDropdown_${idx}`}
              item={item}
              onChange={handleChangeItem(idx)}
              onRemove={handleRemoveItem(idx)}
              onDuplicate={() => handleDuplicateItem(idx)}
            />
          ))}
        </SortableContext>
        </DndContext>

        <Styled.ActionWrapper style={{ justifyContent: 'end' }} onClick={handleAddItem}>
          <Icon icon="add" />
          Add new item
        </Styled.ActionWrapper>
      </Styled.AttributeDropdownWrapper>
    </>
  )
}

export default AttributeDropdown