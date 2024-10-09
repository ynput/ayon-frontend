import { ArrayFieldTemplateProps } from "@rjsf/utils"
import { $Any } from "@types"
import { Button } from "@ynput/ayon-react-components"
import React from "react"
import styled from "styled-components"

const FormArrayField = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
`

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

  const onMoveUp = () => {
    onArrayChanged()
    const r = props.onReorderClick(props.index, props.index - 1)
    r()
  }

  const onMoveDown = () => {
    onArrayChanged()
    const r = props.onReorderClick(props.index, props.index + 1)
    r()
  }

  const rmButton = props.hasRemove && !parentSchema.disabled && (
    <ArrayItemControls>
      <Button onClick={onRemoveItem} icon="close" disabled={undeletable} />
      <Button onClick={onMoveUp} icon="arrow_upward" />
      <Button onClick={onMoveDown} icon="arrow_downward" />
    </ArrayItemControls>
  )

  return (
    <FormArrayFieldItem>
      {children}
      {rmButton}
    </FormArrayFieldItem>
  )
}

const ArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
  /* Complete array including the add button */

  const onAddItem = () => {
    const id = props.idSchema.$id
    const formContext = props.formContext
    const path = formContext.overrides[id]?.path

    formContext.onSetChangedKeys([{ path, isChanged: true }])
    props.onAddClick()
  }

  // for some werird reason, the array sorting breaks when ArrayItemTemplate is
  // not wrapped in react fragment. I suspected it was the key, but it was not.
  // I have no idea why this works, but it does. Do not touch!


  return (
    <FormArrayField style={{outline: 'solid 1px red'}}>
      {props.items.map((element, idx) => (
        <React.Fragment key={idx}>
          <label style={{color: 'red'}}>
          <ArrayItemTemplate {...element} key={element?.key} />
          </label>
        </React.Fragment>
      ))}

      {props.canAdd && !props.schema?.disabled && (
        <ArrayItemControls>
          <Button onClick={onAddItem} icon="add" />
        </ArrayItemControls>
      )}
    </FormArrayField>
  )
}
export default ArrayFieldTemplate