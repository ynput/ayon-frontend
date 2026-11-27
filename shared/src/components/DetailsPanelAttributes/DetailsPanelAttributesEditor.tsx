import type { AttributeModel } from '@shared/api'
import { copyToClipboard } from '@shared/util'
import { FC, useState, useMemo, useEffect } from 'react'
import styled from 'styled-components'
import type { CellValue } from '@shared/containers/ProjectTreeTable/widgets/CellWidget'
import clsx from 'clsx'
import { Button, BorderedSection, Icon, type MixedChange } from '@ynput/ayon-react-components'
import RenderFieldWidget from './components/RenderFieldWidget'
import { isAllDayEndDate } from './components/RenderFieldWidgetHelpers'
import {
  NoMatches,
  GroupHeader,
  GroupMembers,
  EmptyToggle,
  EmptyFields,
} from './DetailsPanelAttributesEditor.styled'
import {
  HEADER_FIELDS,
  TOP_FIELDS,
  buildAttributeItems,
  countItemFields,
  getItemKey,
  isProjectDefault,
  type AttributeItem,
} from './DetailsPanelAttributesEditorHelpers'
import { useLocalStorage } from '@shared/hooks/useLocalStorage'
import { FieldLabel } from '../DetailsPanelDetails/FieldLabel'
import { matchesFieldSearch } from './fieldSearch'
import { useAttributeEnums } from '@shared/hooks/useAttributeEnums'

const FormRow = styled.div`
  display: grid;
  grid-template-columns: minmax(80px, 40%) minmax(0, 1fr) 32px;
  row-gap: 2px;
  column-gap: 4px;
  overflow: hidden;
  align-items: center;
  min-height: 32px;
  position: relative;

  .field-tools {
    opacity: 0;
  }

  &:hover .field-tools {
    opacity: 1;
  }

  /* inside a group: the project's value, nothing set on this entity */
  &.project-default .field-value {
    color: var(--md-sys-color-outline);
  }

  /* no copy button: the value takes its space */
  &.no-tools {
    grid-template-columns: minmax(80px, 40%) minmax(0, 1fr);
  }

  &.multi-line {
    align-items: start;
    .field-value {
      height: auto;
      min-height: 32px;
      max-height: 112px;
      padding-top: 0;
      padding-bottom: 0;
      display: block;
      overflow: visible;
    }
    .field-label {
      /* move down to make it feel more centered */
      margin-top: 6px;
    }
  }
`

const FieldValue = styled.div`
  height: 32px;
  overflow: hidden;
  width: 100%;
  justify-self: start;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  border-radius: 4px;
  padding: 0 4px;
  text-align: left;
  position: relative;
  z-index: 1;

  &:not(.readonly) {
    cursor: pointer;
    pointer-events: auto;
  }

  &:hover:not(.readonly) {
    background-color: var(--md-sys-color-surface-container-low-hover);
  }

  .dropdown .button {
    background-color: unset;
  }

  &.editing {
    background-color: var(--md-sys-color-surface-container);
    cursor: default;
    justify-content: flex-start;
  }

  &.readonly {
    pointer-events: none;
  }
`

const FieldTools = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);

  .tool {
    width: 32px;
    height: 32px;
    padding: 2px;
  }
`

const ShimmerRow = styled(FormRow)`
  &.loading {
    width: 100%;
    height: 33px;
    min-height: unset;
    border-radius: 4px;
    margin-bottom: 4px;
  }
`

export type AttributeField = Omit<AttributeModel, 'position' | 'scope' | 'builtin'> & {
  readonly?: boolean
  hidden?: boolean
  enableCustomValues?: boolean // Allow custom values in enum fields
  enableSearch?: boolean // Enable search functionality in enum fields
  allowNone?: boolean // Allow "None" option for enum fields that can be cleared
}

export interface DetailsPanelAttributesEditorProps {
  title?: string
  isLoading?: boolean // show loading shimmer for 20 placeholder items
  enableEditing?: boolean // if this is false, everything is readonly
  fields: AttributeField[] // the schema for the form
  form: Record<
    string,
    string | number | boolean | Date | any[] | Record<string, any> | undefined | null
  > // the form data
  mixedFields?: string[] // when multiple entities are selected, this is a list of fields that are mixed
  onChange?: (key: string, value: any) => void
  // several entities: values to add to and remove from a list field of each of them
  onMixedChange?: (key: string, change: MixedChange) => void
  entities?: any[] // entities data for scoped statuses
  projectName?: string // enum resolver scope when there are no entities
  entityType?: string // entity type for scoped statuses
  search?: string // the Details tab's search: only the fields whose label, name or value match
  /** key fields first, related attributes grouped, empty fields behind an expander */
  compact?: boolean
  /** compact: the project's values by field name; a group's extra field with one stays in the group */
  defaults?: Record<string, unknown>
}

export const DetailsPanelAttributesEditor: FC<DetailsPanelAttributesEditorProps> = ({
  title,
  isLoading,
  form,
  fields,
  enableEditing,
  mixedFields,
  onChange,
  onMixedChange,
  entities = [],
  projectName,
  entityType = 'task',
  search,
  compact,
  defaults,
}) => {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [showEmpty, setShowEmpty] = useLocalStorage('detailsPanel.attributes.showEmpty', false)
  const [openGroups, setOpenGroups] = useLocalStorage<string[]>(
    'detailsPanel.attributes.openGroups',
    [],
  )
  const toggleGroup = (key: string) =>
    setOpenGroups((open) => (open.includes(key) ? open.filter((k) => k !== key) : [...open, key]))

  // while searching: the options of enums from a resolver, so their values match by the labels
  // shown (the same project as RenderFieldWidget)
  const searchFields = useAttributeEnums(fields, {
    projectName: projectName || entities[0]?.projectName,
    request: search ? 'all' : [],
  })

  const entitySelectionKey = useMemo(
    () => entities.map((entity) => entity?.id).join('|'),
    [entities],
  )

  useEffect(() => {
    setEditingField(null)
  }, [entitySelectionKey])

  const handleStartEditing = (fieldName: string) => {
    if (enableEditing && !fields.find((field) => field.name === fieldName)?.readonly) {
      setEditingField(fieldName)
    } else {
      console.log('Editing not allowed:', {
        enableEditing,
        fieldReadonly: fields.find((field) => field.name === fieldName)?.readonly,
      })
    }
  }

  const handleValueChange = (fieldName: string, value: CellValue | CellValue[]) => {
    setEditingField(null)
    onChange?.(fieldName, value)
  }

  const handleMixedChange = (fieldName: string, change: MixedChange) => {
    setEditingField(null)
    onMixedChange?.(fieldName, change)
  }

  const handleCancelEdit = () => {
    setEditingField(null)
  }

  if (isLoading) {
    return (
      <BorderedSection title="Attributes" withPadding>
        {Array.from({ length: 10 }).map((_, index) => (
          <ShimmerRow key={index}>
            <div className="loading"></div>
            <div className="loading"></div>
          </ShimmerRow>
        ))}
      </BorderedSection>
    )
  }

  const shownFields = fields.filter(
    (field, index) =>
      !field.hidden &&
      matchesFieldSearch(
        searchFields[index],
        form[field.name],
        search,
        [],
        isAllDayEndDate(field.name, entities),
      ),
  )

  const renderField = (field: AttributeField, { inGroup = false, withTools = true } = {}) => {
    const fieldValue = form[field.name]
    const isEditing = editingField === field.name
    const isReadOnly = field.readonly || !enableEditing
    const isMixed = mixedFields?.includes(field.name) || false
    const isDefault = inGroup && isProjectDefault(field.name, form, mixedFields, defaults)

    return (
      <FormRow
        key={field.name}
        className={clsx('field-row', {
          'multi-line': field.data.widget === 'markdown',
          'project-default': isDefault,
          'no-tools': !withTools,
        })}
        data-tooltip={isDefault ? 'Same as the project' : undefined}
        data-tooltip-delay={isDefault ? 700 : undefined}
      >
        <FieldLabel
          name={field.name}
          data={field.data}
          showDetailedTooltip
          className="field-label"
        />
        <FieldValue
          className={clsx('field-value', {
            editing: isEditing,
            readonly: isReadOnly,
          })}
          onClick={(e) => {
            // Allow links to work normally - don't intercept clicks on anchor elements
            if ((e.target as HTMLElement).closest('a')) {
              return
            }
            e.preventDefault()
            if (!isEditing && !isReadOnly && field.data.type !== 'boolean') {
              handleStartEditing(field.name)
            }
          }}
        >
          <RenderFieldWidget
            field={field}
            value={fieldValue}
            isEditing={isEditing}
            isReadOnly={isReadOnly}
            isMixed={isMixed}
            onChange={handleValueChange}
            onMixedChange={onMixedChange && handleMixedChange}
            onCancelEdit={handleCancelEdit}
            onExpand={() => {
              // opens full markdown text editor dialog
            }}
            entities={entities}
            projectName={projectName}
            entityType={entityType}
          />
        </FieldValue>
        {withTools && (
          <FieldTools className="field-tools">
            <Button
              className="tool"
              variant="text"
              icon="content_copy"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const valueToDisplay =
                  fieldValue === null || fieldValue === undefined ? '' : fieldValue
                copyToClipboard(valueToDisplay.toString(), true)
              }}
            />
          </FieldTools>
        )}
      </FormRow>
    )
  }

  const renderItem = (item: AttributeItem) => {
    if (item.type === 'field') return renderField(item.field)
    const { group } = item
    const isOpen = openGroups.includes(group.key)
    return (
      <div key={getItemKey(item)} className="field-group">
        <GroupHeader
          type="button"
          className={clsx({ open: isOpen })}
          aria-expanded={isOpen}
          onClick={() => toggleGroup(group.key)}
          data-tooltip={group.fields.map((f) => f.data.title || f.name).join(', ')}
          data-tooltip-delay={700}
        >
          <span className="group-label">{group.label}</span>
          <span className={clsx('group-summary', { empty: !group.summary })}>
            {group.summary || '—'}
          </span>
          <Icon icon="expand_more" className="icon" />
        </GroupHeader>
        {isOpen && (
          <GroupMembers>
            {group.fields.map((field) => renderField(field, { inGroup: true }))}
          </GroupMembers>
        )}
      </div>
    )
  }

  const visibleFields = fields.filter((field) => !field.hidden)
  // searching shows every match as a plain row, empty or not
  const isCompact = compact && !search
  const headerFields = isCompact
    ? HEADER_FIELDS.map((name) => visibleFields.find((field) => field.name === name)).filter(
        (field): field is AttributeField => !!field,
      )
    : []
  // the name (and its label) first, then status and tags, then the rest
  const top = buildAttributeItems(
    visibleFields.filter((field) => TOP_FIELDS.includes(field.name)),
    form,
    mixedFields,
    defaults,
  )
  const rest = buildAttributeItems(
    visibleFields.filter(
      (field) => !TOP_FIELDS.includes(field.name) && !HEADER_FIELDS.includes(field.name),
    ),
    form,
    mixedFields,
    defaults,
  )
  const empty = [...top.empty, ...rest.empty]
  const emptyCount = countItemFields(empty)

  return (
    <BorderedSection
      title="Attributes"
      autoHeight
      showHeader
      withPadding
      pt={{ content: { style: { minHeight: 'unset' } } }}
    >
      {!shownFields.length && search && <NoMatches>No matching attributes</NoMatches>}
      {isCompact ? (
        <>
          {top.filled.map(renderItem)}
          {/* copying a status or tags is rarely wanted, and a narrow panel needs the room */}
          {headerFields.map((field) => renderField(field, { withTools: false }))}
          {rest.filled.map(renderItem)}
          {!!emptyCount && (
            <EmptyToggle
              type="button"
              aria-expanded={showEmpty}
              onClick={() => setShowEmpty(!showEmpty)}
            >
              <Icon icon={showEmpty ? 'expand_less' : 'expand_more'} className="icon" />
              {showEmpty
                ? 'Hide empty fields'
                : `${emptyCount} empty field${emptyCount === 1 ? '' : 's'}`}
            </EmptyToggle>
          )}
          {showEmpty && <EmptyFields>{empty.map(renderItem)}</EmptyFields>}
        </>
      ) : (
        shownFields.map((field) => renderField(field))
      )}
    </BorderedSection>
  )
}
