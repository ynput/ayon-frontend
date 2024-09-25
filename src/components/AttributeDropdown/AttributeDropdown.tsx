import { uniqueId } from 'lodash'
import { Icon } from '@ynput/ayon-react-components'

import useDraggableList from './hooks/useDraggableList'
import AttributeDropdownItem from './AttributeDropdownItem'
import * as Styled from './AttributeDropdown.styled'
import { closestCenter, DndContext } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { $Any } from '@types'

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

export type NormalizedData = {
  label: string
  value: string
  color?: string
  icon?: string
}

const newItem = (): AttributeData => ({
  id: uniqueId(),
  isExpanded: true,
  label: '',
  value: '',
  isIconEnabled: true,
  isColorEnabled: true,
})
const normalize = (data: AttributeData[]): NormalizedData[] => {
  return data.map(({label, value, icon, color, isIconEnabled, isColorEnabled})=> {
    return {
      label,
      value,
      icon: isIconEnabled ? icon : undefined,
      color: isColorEnabled ? color : undefined,
    }

  })
}

const denormalize = (data: NormalizedData[]): AttributeData[] => {
  return data.map(({ label, value, icon, color }) => ({
    id: uniqueId(),
    isExpanded: false,
    label,
    value,
    icon: icon,
    color: color,
    isIconEnabled: icon !== undefined,
    isColorEnabled: color !== undefined,
  }))

}

const AttributeDropdown = ({values, syncHandler}: {values: $Any, syncHandler: $Any}) => {
  const {
    items,
    handleAddItem,
    handleRemoveItem,
    handleChangeItem,
    handleDuplicateItem,
    handleDraggableEnd,
  } = useDraggableList<AttributeData, NormalizedData>({
    creator: newItem,
    initialData: denormalize(values),
    syncHandler,
    normalizer: normalize,
  })

  return (
    <>
      <Styled.AttributeDropdownWrapper>
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDraggableEnd}
        >
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            {items.map((item, idx) => (
              <AttributeDropdownItem
                key={`AttributeDropdown_${item.id}`}
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