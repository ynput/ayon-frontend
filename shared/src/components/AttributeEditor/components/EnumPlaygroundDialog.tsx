import { FC, KeyboardEvent, useMemo, useState } from 'react'
import { startCase } from 'lodash'
import styled from 'styled-components'
import {
  Dialog,
  Dropdown,
  FormLayout,
  FormRow,
  InputSwitch,
  InputText,
} from '@ynput/ayon-react-components'

import { useGetEnumOptionsQuery } from '@shared/api'
import type { EnumItem, EnumResolverInfo, EnumResolverParams } from '@shared/api'
import { useGlobalContext } from '@shared/context/GlobalContext'
import { getEnumErrorMessage } from '@shared/hooks/useAttributeEnumOptions'
import { getEnumItemIcon, getSelectableEnumItems } from '@shared/util/attributeEnum'
import { EnumItemIcon, EnumItemRow } from './EnumItemRow'

const SKELETON_ROWS = 8
const PARENT_DIALOG_WIDTH = 700
// Slightly smaller than the attribute dialog so it reads as stacked on top of it
const STACK_INSET = 40
const CONTEXT_PARAM_TYPES = ['string', 'integer', 'float', 'boolean']
// The server passes the current user itself, sending it again fails the request
const SERVER_CONTEXT_PARAMS = ['user']

type ContextValue = string | number | boolean | undefined
type ParamType = EnumResolverInfo['acceptedParams'][string]

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
  flex: 1;
  min-height: 0;
`

const Summary = styled.span`
  color: var(--md-sys-color-outline);
`

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
  flex: 1;
  min-height: 200px;
  overflow-y: auto;
  padding: var(--padding-m);
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container);
`

const ItemRow = styled(EnumItemRow)`
  .value {
    margin-left: auto;
    flex: none;
    font-family: monospace;
    color: var(--md-sys-color-outline);
  }
`

const Message = styled.span`
  color: var(--md-sys-color-outline);
`

const parseContextValue = (raw: string, type: ParamType): ContextValue => {
  if (raw === '') return undefined
  if (type === 'string') return raw
  const parsed = type === 'integer' ? parseInt(raw) : parseFloat(raw)
  return Number.isNaN(parsed) ? undefined : parsed
}

interface ContextFieldProps {
  name: string
  type: ParamType
  value: ContextValue
  onChange: (value: ContextValue) => void
}

const ContextField: FC<ContextFieldProps> = ({ name, type, value, onChange }) => {
  const { projects } = useGlobalContext()
  const [draft, setDraft] = useState(value === undefined ? '' : String(value))

  if (name === 'project_name') {
    const options = projects.active.map((project) => ({
      value: project.name,
      label: project.label || project.name,
    }))
    return (
      <Dropdown
        value={typeof value === 'string' ? [value] : []}
        options={options}
        onChange={(selected) => onChange(selected[0])}
        onClear={() => onChange(undefined)}
        placeholder="No project"
        searchOnNumber={10}
        widthExpand
      />
    )
  }

  if (type === 'boolean') {
    return (
      <InputSwitch
        checked={!!value}
        onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
      />
    )
  }

  // Committed on blur so typing does not fire a request per keystroke
  const commit = () => onChange(parseContextValue(draft, type))

  return (
    <InputText
      value={draft}
      type={type === 'string' ? 'text' : 'number'}
      placeholder="Not set"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && commit()}
    />
  )
}

const matchesSearch = (item: EnumItem, query: string) =>
  [item.label, String(item.value), item.description, ...(item.fulltext || [])].some((text) =>
    text?.toLowerCase().includes(query),
  )

export interface EnumPlaygroundDialogProps {
  resolver: EnumResolverInfo
  settings: Record<string, any>
  height?: number
  onClose: () => void
}

export const EnumPlaygroundDialog: FC<EnumPlaygroundDialogProps> = ({
  resolver,
  settings,
  height,
  onClose,
}) => {
  const [context, setContext] = useState<Record<string, ContextValue>>({})
  const [search, setSearch] = useState('')

  const settingNames = new Set((resolver.settingsForm || []).map((field) => field.name))
  const contextParams = Object.entries(resolver.acceptedParams || {}).filter(
    ([name, type]) =>
      !settingNames.has(name) &&
      !SERVER_CONTEXT_PARAMS.includes(name) &&
      CONTEXT_PARAM_TYPES.includes(type),
  )

  const params = useMemo(
    () => ({ ...settings, ...context } as EnumResolverParams),
    [settings, context],
  )

  const { data, isFetching, isError, error } = useGetEnumOptionsQuery({
    enumName: resolver.name,
    params,
  })

  const items = useMemo(
    () =>
      getSelectableEnumItems(data || []).map((item) => ({
        ...item,
        icon: getEnumItemIcon(item.icon),
      })),
    [data],
  )

  const query = search.trim().toLowerCase()
  const filteredItems = query ? items.filter((item) => matchesSearch(item, query)) : items
  const hasIcons = filteredItems.some((item) => !!item.icon)

  // The dialog is portaled, but React still bubbles keys to the attribute dialog behind it
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation()
    if (e.key === 'Escape') onClose()
  }

  const renderList = () => {
    if (isFetching) {
      return Array.from({ length: SKELETON_ROWS }).map((_, index) => (
        <EnumItemRow key={index} className="loading" />
      ))
    }
    if (isError) {
      const detail = getEnumErrorMessage(error)
      return <Message>Could not load items{detail ? `: ${detail}` : '.'}</Message>
    }
    if (!items.length) {
      const hint =
        'project_name' in (resolver.acceptedParams || {}) && !context.project_name
          ? ' Try selecting a project.'
          : ''
      return <Message>No items found.{hint}</Message>
    }
    if (!filteredItems.length) return <Message>No items match "{search}".</Message>

    return filteredItems.map((item) => (
      <ItemRow key={String(item.value)} title={item.description}>
        <EnumItemIcon icon={item.icon} color={item.color} reserveSpace={hasIcons} />
        <span className="label">{item.label}</span>
        <span className="value">{String(item.value)}</span>
      </ItemRow>
    ))
  }

  return (
    <Dialog
      isOpen
      header={`${startCase(resolver.name)} playground`}
      onClose={onClose}
      size="full"
      style={{
        width: PARENT_DIALOG_WIDTH - STACK_INSET,
        height: height ? height - STACK_INSET : '80%',
      }}
      onKeyDown={handleKeyDown}
    >
      <Body>
        {contextParams.length > 0 && (
          <FormLayout>
            {contextParams.map(([name, type]) => (
              <FormRow key={name} label={name}>
                <ContextField
                  name={name}
                  type={type}
                  value={context[name]}
                  onChange={(value) => setContext((current) => ({ ...current, [name]: value }))}
                />
              </FormRow>
            ))}
          </FormLayout>
        )}
        <InputText
          value={search}
          placeholder="Search items..."
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        {!isFetching && !isError && items.length > 0 && (
          <Summary>
            {query ? `${filteredItems.length} of ${items.length} items` : `${items.length} items`}
          </Summary>
        )}
        <List>{renderList()}</List>
      </Body>
    </Dialog>
  )
}
