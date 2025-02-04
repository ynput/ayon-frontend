import { $Any } from '@types'
import { isEqual } from 'lodash'

const parseContext = (props: $Any) => {
  const result = { originalValue: undefined, path: [] }
  if (props.formContext?.overrides && props.formContext.overrides[props.id]) {
    result.originalValue = props.formContext.overrides[props.id].originalValue
    result.path = props.formContext.overrides[props.id].path
  }
  return result
}

const equiv = (a: $Any, b: $Any) => {
  if (typeof a !== typeof b) return false

  if (typeof a === 'object' && a?.length) {
    if (a?.length !== b?.length) return false
    // compare two arrays. return true if they contain the same elements
    // order doesn't matter
    if (a.length !== b.length) return false
    for (const i of a) {
      if (!b.includes(i)) return false
    }
    return true
  }

  return isEqual(a, b)
}

const updateChangedKeys = (props: $Any, changed: $Any, path: $Any) => {
  if (!props.formContext) return // WARN! (but shouldn't happen)
  if (!path?.length) return // WARN!
  if (!changed) return
  props.formContext.onSetChangedKeys([{ path, isChanged: true }])
}

const getDefaultValue = (props: $Any) => {
  if (props.schema.widget === 'color' && !props.value) {
    if (props.schema.default) {
      return props.schema.default
    }
    if (props.schema.colorFormat === 'hex') {
      return props.schema.colorAlpha ? '#00000000' : '#000000'
    }
    return props.schema.colorAlpha ? [0, 0, 0, 0] : [0, 0, 0]
  }
  if (![undefined, null].includes(props.value)) {
    return props.value
  }

  if (props.schema.type === 'boolean') {
    return props.schema.default || false
  }

  if (props.schema.type === 'string') {
    return props.schema.default || ''
  }

  if (props.schema.type === 'integer') {
    return props.schema.default || 0
  }
}
export { getDefaultValue, equiv, parseContext, updateChangedKeys }
