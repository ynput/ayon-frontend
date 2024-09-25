import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Icon, IconSelect, InputSwitch } from '@ynput/ayon-react-components'
import * as Styled from './AttributeDropdown.styled'
import { AttributeData } from './AttributeDropdown'
import clsx from 'clsx'

type AttributeDropdownItemProps = {
  item: AttributeData
  onChange: (attr: keyof AttributeData, value: string | boolean) => void
  onRemove: () => void
  onDuplicate: () => void
}

const AttributeDropdownItem = ({
  item,
  onChange,
  onRemove,
  onDuplicate,
}: AttributeDropdownItemProps) => {
  const icon = item.icon || 'question_mark'
  const iconColor = item.color && item.isColorEnabled ? item.color : 'initial'

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
    animateLayoutChanges: () => false,
  })

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  }

  return (
    <Styled.AttributeDropdownItemWrapper ref={setNodeRef} style={style}>
      <Styled.AttributeDropdownItemHeader className={clsx({ expanded: item.isExpanded })}>
        <Icon
          className="icon"
          icon={icon && item.isIconEnabled ? icon : ''}
          style={{ color: iconColor }}
        />

        <span className="label" style={{ color: iconColor }}>
          {item.label}
        </span>
        <Icon
          className="icon actionable toggle-expand"
          onClick={() => {
            onChange('isExpanded', !item.isExpanded)
          }}
          icon={item.isExpanded ? 'collapse_all' : 'expand_all'}
        />
        <Icon {...listeners} {...attributes} className="icon actionable" icon="drag_indicator" />
      </Styled.AttributeDropdownItemHeader>

      <Styled.AttributeDropdownItemBodyExpander
      className={clsx({expanded: item.isExpanded})}>
        <Styled.AttributeDropdownItemBody
          className={clsx(item.isExpanded ? 'expanded' : 'collapsed')}
        >
          <Styled.Row key="label">
            <Styled.Label> Label </Styled.Label>
            <Styled.InputText
              onChange={(event) => onChange('label', event.target.value)}
              value={item.label}
            />
          </Styled.Row>

          <Styled.Row key="value">
            <Styled.Label> Value </Styled.Label>
            <Styled.InputText
              onChange={(event) => onChange('value', event.target.value)}
              value={item.value}
            />
          </Styled.Row>

          <Styled.Row key="icon">
            <Styled.Label> Icon </Styled.Label>
            <IconSelect
              disabled={!item.isIconEnabled}
              className="compact"
              value={[icon]}
              style={{ maxWidth: 'auto' }}
              onChange={(value) => {
                if (item.isIconEnabled) {
                  return onChange('icon', value[0])
                }
              }}
            />
            <InputSwitch
              checked={item.isIconEnabled}
              onChange={(event) => {
                return onChange('isIconEnabled', (event.target as HTMLInputElement).checked)
              }}
            />
          </Styled.Row>

          <Styled.Row key="color">
            <Styled.Label className="compact"> Color </Styled.Label>
            {item.isColorEnabled && (
              <Styled.InputColor
                value={item.color || '#000000'}
                onChange={(event) => {
                  if (item.isColorEnabled) {
                    onChange('color', event?.target.value.toString())
                  }
                }}
              />
            )}
            {!item.isColorEnabled && (
              <Styled.MockInputColor
                style={{ backgroundColor: item.color }}
                readOnly
                value=""
                onChange={(event) => {
                  if (item.isColorEnabled) {
                    onChange('color', event?.target.value.toString())
                  }
                }}
              />
            )}
            <InputSwitch
              checked={item.isColorEnabled}
              onChange={(event) =>
                onChange('isColorEnabled', (event.target as HTMLInputElement).checked)
              }
            />
          </Styled.Row>

          <Styled.Row className="footer">
            <Styled.ActionWrapper onClick={onRemove}>
              <Icon icon="close" />
              Remove
            </Styled.ActionWrapper>
            <Styled.ActionWrapper onClick={onDuplicate}>
              <Icon icon="content_copy" />
              Duplicate
            </Styled.ActionWrapper>
          </Styled.Row>
        </Styled.AttributeDropdownItemBody>
      </Styled.AttributeDropdownItemBodyExpander>
    </Styled.AttributeDropdownItemWrapper>
  )
}

export default AttributeDropdownItem
