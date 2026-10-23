import { ArrayFieldTemplateItemType } from '@rjsf/utils'
import { $Any } from '@types'
import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import clsx from 'clsx'
import { ReactElement, cloneElement } from 'react'
import { RemoveItemButton } from './ArrayFieldTemplate.styled'
import { SettingsListItemContext } from '../SettingsGroup/SettingsListItemContextInstance'
import { useListItemFold } from './useListItemFold'

const ArrayItemControls = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  gap: 5px;

  button {
    border-radius: 50%;
    width: 30px;
    height: 30px;
  }
`
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
  /** False when the list's values are too long for boxed rows (see listValuesFitRows) */
  rowsFit?: boolean
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
  // an item holding one control, not a group, is drawn as a single bordered field
  const itemType = childProps.schema?.type
  const isSimple = flatLayout && !['object', 'array'].includes(itemType)

  const { isFoldable, itemState, onItemRemoved, rowSchema } = useListItemFold({
    registry: props.registry,
    childProps,
    index: props.index,
    rowsFit: props.rowsFit,
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

  // a short item renders with the compact layout, which draws it as a boxed row
  const content = rowSchema
    ? cloneElement(props.children as unknown as ReactElement, { schema: rowSchema })
    : props.children

  return (
    <FormArrayFieldItem className={clsx('array-item-row', isSimple && 'array-item-simple')}>
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
