import { ArrayFieldTemplateItemType } from '@rjsf/utils'
import { $Any } from '@types'
import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { ReactElement, cloneElement } from 'react'
import { ArrayItemControls, RemoveItemButton } from './ArrayFieldTemplate.styled'
import { SettingsListItemContext } from '../SettingsGroup/SettingsListItemContextInstance'
import { useListItemFold } from './useListItemFold'
import type { ListItemLayout } from './listItemLayout'

const FormArrayFieldItem = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: row;
  gap: var(--base-gap-large);

  margin-right: 4px;

  .panel-content {
    flex-grow: 1;
  }
`

const DeleteButton = styled(Button)`
  /* on hover show red */
  &:hover {
    background-color: var(--md-sys-color-error-container);
  }
`

type Props = ArrayFieldTemplateItemType & {
  children: {
    _owner: $Any
  }
  onChange: Function
  /** How the item is drawn in the flat layout (useListItemLayouts) */
  layout?: ListItemLayout
}

const ArrayItemTemplate = (props: Props) => {
  const parentSchema = props?.children?._owner?.memoizedProps?.schema || {}
  const itemName = props?.children?.props?.formData?.name
  let undeletable = false

  if (itemName && (parentSchema.requiredItems || []).includes(itemName)) {
    undeletable = true
    // TODO: Store this information elsewhere. since switching to RTK query
    // schema props are immutable! use form context maybe?

    //if (children.props.formData.name === itemName)
    //  children.props.schema.properties.name.fixedValue = itemName
  }

  const formContext = props.registry?.formContext
  const flatLayout = !!formContext?.flatLayout
  const childProps = (props.children as $Any)?.props || {}

  const { isFoldable, itemState, onItemRemoved, contentSchema } = useListItemFold({
    formContext,
    layout: props.layout,
    childProps,
    index: props.index,
  })

  const onRemoveItem = () => {
    props.onChange()
    props.onDropIndexClick(props.index)()
    onItemRemoved()
  }

  const rmButton = props.hasRemove && !parentSchema.disabled && (
    <ArrayItemControls className="array-item-controls">
      {flatLayout ? (
        <RemoveItemButton
          onClick={onRemoveItem}
          icon="close"
          variant="text"
          className="delete remove-item"
          aria-label="Remove item"
          data-tooltip="Remove item"
          disabled={undeletable}
        />
      ) : (
        <DeleteButton
          onClick={onRemoveItem}
          icon="delete"
          className="delete"
          disabled={undeletable}
        />
      )}
    </ArrayItemControls>
  )

  // a row or a card renders with the compact layout, which draws its fields side by side
  const content = contentSchema
    ? cloneElement(props.children as unknown as ReactElement, { schema: contentSchema })
    : props.children

  return (
    <FormArrayFieldItem className="array-item-row">
      {isFoldable ? (
        <SettingsListItemContext.Provider value={itemState}>
          {content}
        </SettingsListItemContext.Provider>
      ) : (
        content
      )}
      {rmButton}
    </FormArrayFieldItem>
  )
}

export default ArrayItemTemplate
