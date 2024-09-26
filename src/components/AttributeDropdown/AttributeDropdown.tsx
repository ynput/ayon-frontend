import { uniqueId } from 'lodash'
import { Button, Icon } from '@ynput/ayon-react-components'

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
  isLabelFocused: boolean
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
  isLabelFocused: true,
  isIconEnabled: false,
  isColorEnabled: false,
})
const normalize = (data: AttributeData[]): NormalizedData[] => {
  return data
    .filter((item) => item.label !== '' && item.value !== '')
    .map(({ label, value, icon, color, isIconEnabled, isColorEnabled }) => {
      return {
        label,
        value,
        icon: isIconEnabled ? icon : undefined,
        color: isColorEnabled ? color : undefined,
      }
    })
}

const denormalize = (data: NormalizedData[]): AttributeData[] => {
  return data.map(({ label, value, icon, color }) => {
    return ({
      id: uniqueId(),
      isExpanded: false,
      label,
      value,
      icon: icon,
      color: color,
      isLabelFocused: false,
      isIconEnabled: icon !== '' && icon !== null,
      isColorEnabled: color !== '' && color !== null,
    })
  })

}

const AttributeDropdown = ({ values, syncHandler }: { values: $Any; syncHandler: $Any }) => {
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
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDraggableEnd}>
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            {items.map((item, idx) => (
              <AttributeDropdownItem
                key={`AttributeDropdown_${item.id}`}
                item={item}
                onChange={handleChangeItem(idx)}
                onRemove={handleRemoveItem(idx)}
                onDuplicate={() => handleDuplicateItem(idx, { isLabelFocused: true })}
              />
            ))}
          </SortableContext>
        </DndContext>

        <Styled.Row className="footer" style={{ justifyContent: 'end' }}>
          <Styled.ActionWrapper>
            <Button icon="add" variant="text" onClick={handleAddItem}>
              Add new item
            </Button>
          </Styled.ActionWrapper>
        </Styled.Row>
      </Styled.AttributeDropdownWrapper>
    </>
  )
}

export default AttributeDropdown