import { FC, KeyboardEvent, ReactNode, useMemo, useState } from 'react'
import { startCase } from 'lodash'
import { matchSorter } from 'match-sorter'
import styled from 'styled-components'
import { Dialog, Dropdown, FormLayout, FormRow, InputText } from '@ynput/ayon-react-components'

import { JsonViewer } from '@shared/components/JsonViewer'
import { SimpleForm } from '@shared/components/SimpleForm'
import type { SimpleFormValueDict } from '@shared/components/SimpleForm'
import { useGetAllAssigneesQuery, useGetEnumOptionsQuery } from '@shared/api'
import type { EnumItem, EnumResolverInfo, EnumResolverParams } from '@shared/api'
import { useGlobalContext } from '@shared/context/GlobalContext'
import {
  getEnumErrorText,
  getEnumItemIcon,
  getSelectableEnumItems,
  isEnumContextParam,
} from '@shared/util/attributeEnum'
import type { EnumContextParam } from '@shared/util/attributeEnum'
import { EnumItemIcon, EnumItemRow } from './EnumItemRow'

const SKELETON_ROWS = 8
const DROPDOWN_SEARCH_THRESHOLD = 10

type ContextValue = string | undefined

const Body = styled.div`
  display: flex;
  gap: var(--base-gap-large);
  flex: 1;
  min-height: 0;
`

const Details = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
  flex: 0.5;
  min-width: 0;
  overflow-y: auto;
  overflow-x: hidden;

  /* ARC FormRow labels size to their text; pin them so both sections share one column */
  .label:has(+ .field) {
    width: 200px;
    min-width: 200px;
    flex: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);
`

const SectionTitle = styled.div`
  font-weight: 500;
  color: var(--md-sys-color-outline);
  padding: 4px 0;
`

const Results = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
  flex: 1;
  min-width: 0;
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

interface ParamFieldProps {
  value: ContextValue
  onChange: (value: ContextValue) => void
}

const ProjectParamField: FC<ParamFieldProps> = ({ value, onChange }) => {
  const { projects } = useGlobalContext()
  const options = projects.active.map((project) => ({
    value: project.name,
    label: project.label || project.name,
  }))

  return (
    <Dropdown
      value={value ? [value] : []}
      options={options}
      onChange={(selected) => onChange(selected[0])}
      onClear={() => onChange(undefined)}
      placeholder="No project"
      searchOnNumber={DROPDOWN_SEARCH_THRESHOLD}
      widthExpand
    />
  )
}

const UserParamField: FC<ParamFieldProps> = ({ value, onChange }) => {
  const { data: users = [], isLoading } = useGetAllAssigneesQuery({})
  const options = users.map((user) => ({
    value: user.name,
    label: user.fullName || user.name,
  }))

  return (
    <Dropdown
      value={value ? [value] : []}
      options={options}
      onChange={(selected) => onChange(selected[0])}
      onClear={() => onChange(undefined)}
      placeholder={isLoading ? 'Loading...' : 'No user'}
      searchOnNumber={DROPDOWN_SEARCH_THRESHOLD}
      widthExpand
    />
  )
}

const PARAM_FIELDS: Record<EnumContextParam, FC<ParamFieldProps>> = {
  project_name: ProjectParamField,
  user: UserParamField,
}

const SEARCH_KEYS = ['label', (item: EnumItem) => String(item.value), 'description', 'fulltext']

export interface EnumDebugDialogProps {
  resolver: EnumResolverInfo
  settings: SimpleFormValueDict
  onClose: () => void
}

export const EnumDebugDialog: FC<EnumDebugDialogProps> = ({ resolver, settings, onClose }) => {
  const [context, setContext] = useState<Partial<Record<EnumContextParam, ContextValue>>>({})
  const [formValues, setFormValues] = useState<SimpleFormValueDict>(settings)
  const [search, setSearch] = useState('')

  const { user: currentUser } = useGlobalContext()
  const settingsFields = resolver.settingsForm || []
  const settingNames = new Set(settingsFields.map((field) => field.name))
  const acceptedParams = resolver.acceptedParams || {}
  // every resolver runs as the caller; only admins may resolve it as somebody else
  const isAdmin = !!currentUser?.data?.isAdmin
  const contextParams = Object.keys(acceptedParams).filter(
    (name) => !settingNames.has(name) && (name !== 'user' || isAdmin),
  )
  const canResolveAsUser = isAdmin && !('user' in acceptedParams)

  const params = useMemo(
    () => ({ ...formValues, ...context } as EnumResolverParams),
    [formValues, context],
  )

  const { data, isFetching, isError: isRequestError } = useGetEnumOptionsQuery({
    enumName: resolver.name,
    params,
  })

  const items = useMemo(
    () =>
      getSelectableEnumItems(data?.items || []).map((item) => ({
        ...item,
        icon: getEnumItemIcon(item.icon),
      })),
    [data],
  )

  const isError = isRequestError || !!data?.error
  const query = search.trim()
  const filteredItems = useMemo(
    () =>
      query
        ? matchSorter(items, query, {
            keys: SEARCH_KEYS,
            threshold: matchSorter.rankings.CONTAINS,
          })
        : items,
    [items, query],
  )
  const hasIcons = filteredItems.some((item) => !!item.icon)

  // The dialog is portaled, but React still bubbles keys to the attribute dialog behind it
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation()
    if (e.key === 'Escape') onClose()
  }

  const renderContextParams = (): ReactNode => {
    if (!contextParams.length && !canResolveAsUser)
      return <Message>This resolver has no context params.</Message>

    return (
      <FormLayout>
        {canResolveAsUser && (
          <FormRow label="user">
            <UserParamField
              value={context.user}
              onChange={(value) => setContext((current) => ({ ...current, user: value }))}
            />
          </FormRow>
        )}
        {contextParams.map((name) => {
          const ParamField = isEnumContextParam(name) ? PARAM_FIELDS[name] : undefined
          return (
            <FormRow key={name} label={name}>
              {ParamField && isEnumContextParam(name) ? (
                <ParamField
                  value={context[name]}
                  onChange={(value) => setContext((current) => ({ ...current, [name]: value }))}
                />
              ) : (
                <Message>Not supported in debug.</Message>
              )}
            </FormRow>
          )
        })}
      </FormLayout>
    )
  }

  const renderList = () => {
    if (isFetching) {
      return Array.from({ length: SKELETON_ROWS }).map((_, index) => (
        <EnumItemRow key={index} className="loading" />
      ))
    }
    if (isError) return <Message>{getEnumErrorText(data?.error)}</Message>
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
      header={`Debug: ${startCase(resolver.name)}`}
      onClose={onClose}
      size="full"
      style={{ width: '95vw', maxWidth: '95vw', height: '95vh', maxHeight: '95vh' }}
      onKeyDown={handleKeyDown}
    >
      <Body>
        <Details>
          <Section>
            <SectionTitle>Context Params</SectionTitle>
            {renderContextParams()}
          </Section>
          <Section>
            <SectionTitle>Form</SectionTitle>
            {settingsFields.length ? (
              <SimpleForm fields={settingsFields} values={settings} onChange={setFormValues} />
            ) : (
              <Message>This resolver has no settings.</Message>
            )}
          </Section>
          <Section>
            <SectionTitle>Enum Resolver Data</SectionTitle>
            <JsonViewer value={resolver} wrap />
          </Section>
        </Details>
        <Results>
          <InputText
            value={search}
            placeholder="Search items..."
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {!isFetching && !isError && items.length > 0 && (
            <Summary>
              {query
                ? `${filteredItems.length} of ${items.length} ${items.length === 1 ? 'item' : 'items'}`
                : `${items.length} ${items.length === 1 ? 'item' : 'items'}`}
            </Summary>
          )}
          <List>{renderList()}</List>
        </Results>
      </Body>
    </Dialog>
  )
}
