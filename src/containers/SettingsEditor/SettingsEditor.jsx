import Form from '@rjsf/core'
import validator from '@rjsf/validator-ajv8'

import { useState, useMemo, useEffect, useRef } from 'react'

import { CheckboxWidget } from './Widgets/CheckboxWidget'
import FieldTemplate from './FormTemplates/FieldTemplate'
import ObjectFieldTemplate from './FormTemplates/ObjectFieldTemplate'
import ArrayFieldTemplate from './FormTemplates/ArrayFieldTemplate'
import './SettingsEditor.sass'
import { TextWidget } from './Widgets/TextWidget'
import { SelectWidget } from './Widgets/SelectWidget'
import { DateTimeWidget } from './Widgets/DateTimeWidget'
import { FormWrapper } from './SettingsEditor.styled'

const waitForElm = (selector, timeout = 3000) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector))
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect()
        resolve(document.querySelector(selector))
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    setTimeout(() => {
      observer.disconnect()
      reject(new Error(`Element with selector "${selector}" did not appear within ${timeout}ms`))
    }, timeout)
  })
}

const widgets = {
  TextWidget,
  SelectWidget,
  CheckboxWidget,
  DateTimeWidget,
}

// Just close the top-level object to a simple div
const uiSchema = {
  'ui:FieldTemplate': (props) => <div className="form-root-field">{props.children}</div>,
}

const buildOverrides = (formData, saveOriginalValue = false) => {
  let result = {}

  const crawl = (obj, path = []) => {
    for (const key in obj) {
      const value = obj[key]
      const newPath = path.concat(key)
      const objId = `root_${newPath.join('_')}`
      if (typeof value === 'object') {
        result[objId] = {
          path: newPath,
          type: Array.isArray(value) ? 'array' : 'branch',
          //level: 'default',
        }
        crawl(value, newPath)
      } else {
        result[objId] = {
          path: newPath,
          type: 'leaf',
          //level: 'default',
          value: value,
        }
        if (saveOriginalValue) {
          result[objId].originalValue = value
        }
      }
    }
  }

  crawl(formData)
  return result
}

const noop = () => {}

const SettingsEditor = ({
  schema,
  originalData,
  formData,
  onChange,
  overrides,
  breadcrumbs,
  onSetBreadcrumbs,
  onSetChangedKeys,
  level,
  changedKeys,
  context,
}) => {
  const [localBreadcrumbs, setLocalBreadcrumbs] = useState([])
  const formWrapperRef = useRef()

  const originalOverrides = useMemo(() => {
    const result = buildOverrides(originalData, true)
    for (const key in overrides) {
      if (!(key in result)) result[key] = {}
      result[key].level = overrides[key].level
      result[key].inGroup = overrides[key].inGroup
    }
    return result
  }, [originalData, overrides])

  const formContext = useMemo(() => {
    if (!schema) return {}
    const formOverrides = buildOverrides(formData)

    for (const key in formOverrides) {
      if (key in (overrides || {})) {
        if (!formOverrides[key]) formOverrides[key] = {}
        formOverrides[key].level = overrides[key]?.level || 'default'
        formOverrides[key].inGroup = overrides[key]?.inGroup || false
      }
      if (formOverrides[key].type === 'leaf') {
        formOverrides[key].originalValue = originalOverrides[key]?.originalValue
      }
    }

    return {
      overrides: formOverrides,
      changedKeys: changedKeys || [],
      level: level || 'studio',
    }
  }, [schema, formData, overrides, level, changedKeys])

  // we need to add the props.context to form context independently
  // otherwise it breaks memoized overrides
  //

  const setBc = (bc) => {
    if (breadcrumbs === undefined) {
      //console.log('setlocalBreadcrumbs', bc)
      setLocalBreadcrumbs(bc)
    }
    if (onSetBreadcrumbs) onSetBreadcrumbs(bc)
  }

  const totallyRealBreadcrumbs = breadcrumbs === undefined ? localBreadcrumbs : breadcrumbs
  const currentId = totallyRealBreadcrumbs?.length && `root_${totallyRealBreadcrumbs.join('_')}`

  useEffect(() => {
    if (!currentId) return
    const wrapper = document.getElementById('settings-scroll-panel')
    if (!wrapper) return

    waitForElm(`[data-fieldid='${currentId}']`).then((el) => {
      const rect = el.getBoundingClientRect()
      const wrapperRect = wrapper.getBoundingClientRect()
      if (rect.top > wrapperRect.top && rect.top < wrapperRect.bottom) return
      el.scrollIntoView({ behavior: 'instant', block: 'start' })
    })
  }, [currentId])

  if (!schema) {
    // TODO: maybe a spinner or something?
    return <div></div>
  }

  const fullContext = {
    ...context,
    ...formContext,
    onSetChangedKeys: onSetChangedKeys || noop,
    onSetBreadcrumbs: setBc,
    breadcrumbs: totallyRealBreadcrumbs,
    currentId: currentId,
  }

  // console.log('context? ', fullContext)
  // console.log('schema? ', schema)

  return (
    <FormWrapper $currentSelection={currentId} ref={formWrapperRef}>
      <Form
        schema={schema}
        uiSchema={uiSchema}
        formData={formData}
        formContext={fullContext}
        widgets={widgets}
        onChange={(evt) => onChange(evt.formData)}
        templates={{
          FieldTemplate,
          ArrayFieldTemplate,
          ObjectFieldTemplate,
        }}
        onError={(evt) => console.log('Form contains errors:', evt)}
        validator={validator}
      >
        <div />
      </Form>
    </FormWrapper>
  )
}

export default SettingsEditor
