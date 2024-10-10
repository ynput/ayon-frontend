import { $Any } from "@types"
import { Button } from '@ynput/ayon-react-components'
import styled from "styled-components"

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

const ArrayItemTemplate = (props: $Any) => {
  const parentSchema = props?.children?._owner?.memoizedProps?.schema || {}
  const itemName = props?.children?.props?.formData?.name
  let undeletable = false

  const children = props.children

  if (itemName && (parentSchema.requiredItems || []).includes(itemName)) {
    undeletable = true
    // TODO: Store this information elsewhere. since switching to RTK query
    // schema props are immutable! use form context maybe?

    //if (children.props.formData.name === itemName)
    //  children.props.schema.properties.name.fixedValue = itemName
  }

  const onArrayChanged = () => {
    const parentId = props.children.props.idSchema.$id.split('_').slice(0, -1).join('_')
    const formContext = props.children._owner.memoizedProps.formContext
    const path = formContext.overrides[parentId].path
    formContext.onSetChangedKeys([{ path, isChanged: true }])
  }

  const onRemoveItem = () => {
    onArrayChanged()
    const r = props.onDropIndexClick(props.index)
    r()
  }

  /*
  const onMoveUp = () => {
    onArrayChanged()
    const r = props.onReorderClick(props.index, props.index - 1)
    r()
  }
    */

  const rmButton = props.hasRemove && !parentSchema.disabled && (
    <ArrayItemControls>
      <Button onClick={onRemoveItem} icon="delete" disabled={undeletable} />
    </ArrayItemControls>
  )

  return (
    <FormArrayFieldItem>
      {children}
      {rmButton}
    </FormArrayFieldItem>
  )
}

export { ArrayItemTemplate }