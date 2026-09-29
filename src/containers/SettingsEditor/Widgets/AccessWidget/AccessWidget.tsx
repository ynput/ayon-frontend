import { useState, useEffect } from 'react'
import { updateChangedKeys, parseContext } from '../../helpers'
import AccessEditorDialog, {
  AccessOption,
  AccessValues,
  DEFAULT_SHARE_OPTIONS,
} from './AccessEditorDialog'
import { AccessPreviewButton } from './AccessPreviewButton'
import {
  EVERY_GUESTS_KEY,
  EVERYONE_GROUP_KEY,
} from '@shared/components/ShareOptionIcon/ShareOptionIcon'
import { useGetShareOptionsQuery } from '@shared/api/queries/share/share'

const CATEGORIES_ACCESS_ID = 'activity_categories'
const categoryAccessOptions: AccessOption[] = [
  { label: 'No Access', value: 0, tooltip: 'Cannot view or create comments with this category.' },
  { label: 'Viewer', value: 10, tooltip: 'Can view comments with this category.' },
  { label: 'Creator', value: 20, tooltip: 'Can create and view comments with this category.' },
]

export interface AccessWidgetProps {
  formData?: AccessValues | null
  onChange: (value: AccessValues) => void
  defaultAccess?: AccessValues
  options?: { defaultAccess?: AccessValues; previewMode?: 'default' | 'compact' }
  formContext?: {
    headerProjectName?: string
  }
  idSchema?: { $id?: string }
  schema?: any
  uiSchema?: any
  id: string
}

const DEFAULT_ACCESS_PLACEHOLDER: AccessValues = { [EVERYONE_GROUP_KEY]: 30 }
const DEFAULT_ACCESS_CATEGORIES: AccessValues = { [EVERYONE_GROUP_KEY]: 0 }

const getFallbackShareOptionLabel = (key: string) => {
  if (key === EVERYONE_GROUP_KEY) return 'Everyone'
  if (key === EVERY_GUESTS_KEY) return 'All Guests'

  const label = key
    .replace(/^(group|team|user|guest):/, '')
    .replace(/[_-]+/g, ' ')
    .trim()

  return label ? label[0].toUpperCase() + label.slice(1) : key
}

const areAccessValuesEqual = (left: AccessValues, right: AccessValues) =>
  Object.keys(left).length === Object.keys(right).length &&
  Object.keys(left).every((key) => left[key] === right[key])

const AccessWidget = (props: AccessWidgetProps) => {
  const { path } = parseContext(props)
  const projectName = props?.formContext?.headerProjectName || ''
  const isCategoriesAccess = props.id.includes(CATEGORIES_ACCESS_ID)
  const defaultAccess =
    props.defaultAccess ??
    props.options?.defaultAccess ??
    (isCategoriesAccess ? DEFAULT_ACCESS_CATEGORIES : DEFAULT_ACCESS_PLACEHOLDER)

  const [value, setValue] = useState<AccessValues>(props.formData || {})
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setValue(props.formData || {})
  }, [props.formData])

  const effectiveValue = Object.keys(value).length ? value : defaultAccess
  const needsShareOptions = Object.keys(effectiveValue).some(
    (key) => key !== EVERYONE_GROUP_KEY && key !== EVERY_GUESTS_KEY,
  )
  const { data: apiShareOptions } = useGetShareOptionsQuery(
    { projectName: projectName || undefined },
    { skip: !needsShareOptions },
  )

  const shareOptions = [...DEFAULT_SHARE_OPTIONS, ...(apiShareOptions || [])]
  const valueMap = Object.entries(effectiveValue).map(([key, accessLevel]) => {
    const option = shareOptions.find((option) => option.value === key || option.name === key)
    return {
      name: key,
      label: option?.label?.trim() || getFallbackShareOptionLabel(key),
      shareType: option?.shareType,
      iconName: option?.name,
      accessLevel,
    }
  })

  const onDialogSubmit = (commitValue: AccessValues | null) => {
    console.log('Dialog submitted with value:', commitValue)
    if (commitValue === null) {
      setIsOpen(false)
      return
    }

    const nextValue =
      Object.keys(value).length === 0 && areAccessValuesEqual(commitValue, defaultAccess)
        ? value
        : commitValue
    const isChanged = !areAccessValuesEqual(nextValue, value)
    if (isChanged) {
      setValue(nextValue)
      props.onChange(nextValue)
    }
    setTimeout(() => {
      updateChangedKeys(props, isChanged, path)
    }, 100)
    setIsOpen(false)
  }

  return (
    <>
      <AccessPreviewButton
        value={valueMap}
        accessOptions={isCategoriesAccess ? categoryAccessOptions : undefined}
        mode={props.options?.previewMode ?? (isCategoriesAccess ? 'compact' : 'default')}
        onClick={() => setIsOpen(true)}
      />
      {isOpen && (
        <AccessEditorDialog
          projectName={projectName}
          initialValue={effectiveValue}
          onSubmit={onDialogSubmit}
          accessOptions={isCategoriesAccess ? categoryAccessOptions : undefined}
        />
      )}
    </>
  )
}

export default AccessWidget
