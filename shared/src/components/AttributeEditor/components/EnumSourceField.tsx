import { FC, KeyboardEvent, useMemo, useState } from 'react'
import { startCase } from 'lodash'
import styled from 'styled-components'
import { Button, Dropdown } from '@ynput/ayon-react-components'

import { EnumEditor } from '@shared/components/EnumEditor/EnumEditor'
import type { NormalizedData } from '@shared/components/EnumEditor/EnumEditor'
import { InfoMessage } from '@shared/components/InfoMessage'
import { SimpleForm } from '@shared/components/SimpleForm'
import type { SimpleFormValueDict } from '@shared/components/SimpleForm'
import { useListEnumsQuery } from '@shared/api'
import type { AttributeData, EnumResolverInfo, SimpleFormField } from '@shared/api'
import { useAttributeEnumOptions } from '@shared/hooks/useAttributeEnumOptions'
import {
  getEnumContextParams,
  getEnumItemIcon,
  getSelectableEnumItems,
} from '@shared/util/attributeEnum'
import type { EnumContextParam } from '@shared/util/attributeEnum'
import { EnumItemIcon, EnumItemRow } from './EnumItemRow'
import { EnumDebugDialog } from './EnumDebugDialog'

const CUSTOM_ENUM_SOURCE = '__custom__'
const PREVIEW_LIMIT = 5
const EMPTY_FIELDS: SimpleFormField[] = []
const EMPTY_PREVIEW_MESSAGE = 'No preview items found.'
const SEARCH_THRESHOLD = 5

const CONTEXT_PARAM_MESSAGES: Record<EnumContextParam, string> = {
  project_name: 'The select options will change based on the project it is used in.',
  user: 'The select options will change based on the user that is selected.',
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
  flex: 1;
`

const Message = styled.span`
  color: var(--md-sys-color-outline);
`

const Preview = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
  padding: var(--padding-m);
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container);
`

const MoreButton = styled.button`
  display: flex;
  align-items: center;
  align-self: flex-start;
  height: 20px;
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  color: var(--md-sys-color-outline);
  cursor: pointer;

  &:hover {
    color: var(--md-sys-color-on-surface);
    text-decoration: underline;
  }
`

const ClickableInfoMessage = styled(InfoMessage)`
  cursor: pointer;
  padding: var(--padding-s) var(--padding-m);

  .content {
    gap: var(--base-gap-small);
  }

  &:hover {
    filter: brightness(1.15);
  }
`

const SkeletonItem = styled(EnumItemRow)`
  &:nth-child(2n) {
    width: 80%;
  }

  &:last-of-type {
    width: 64px;
  }
`

interface EnumResolverPreviewProps {
  resolver: string
  acceptedParams: EnumResolverInfo['acceptedParams']
  settings: Record<string, any>
  onShowMore: () => void
}

const EnumResolverPreview: FC<EnumResolverPreviewProps> = ({
  resolver,
  acceptedParams,
  settings,
  onShowMore,
}) => {
  const data = useMemo(
    () => ({ enumResolver: resolver, enumResolverSettings: settings } as AttributeData),
    [resolver, settings],
  )
  const { options: allOptions, isLoading, isError, errorMessage } = useAttributeEnumOptions(data)
  const options = getSelectableEnumItems(allOptions)
  const contextParams = getEnumContextParams(acceptedParams)

  if (isLoading)
    return (
      <Preview>
        {Array.from({ length: PREVIEW_LIMIT + 1 }).map((_, index) => (
          <SkeletonItem key={index} className="loading" />
        ))}
      </Preview>
    )
  if (isError)
    return (
      <Preview>
        <Message>
          Could not load options for "{resolver}"{errorMessage ? `: ${errorMessage}` : '.'}
        </Message>
      </Preview>
    )
  if (!options.length)
    return (
      <Preview>
        <Message>
          {EMPTY_PREVIEW_MESSAGE}
          {contextParams.length > 0 &&
            ` This could be because in context parameters (${contextParams.join(
              ', ',
            )}) are required to get the items.`}
        </Message>
      </Preview>
    )

  const remaining = options.length - PREVIEW_LIMIT
  const preview = options
    .slice(0, PREVIEW_LIMIT)
    .map((option) => ({ option, icon: getEnumItemIcon(option.icon) }))
  const hasIcons = preview.some(({ icon }) => !!icon)

  return (
    <Preview>
      {preview.map(({ option, icon }) => (
        <EnumItemRow key={String(option.value)}>
          <EnumItemIcon icon={icon} color={option.color} reserveSpace={hasIcons} />
          <span className="label">{option.label}</span>
        </EnumItemRow>
      ))}
      {remaining > 0 && (
        <MoreButton type="button" onClick={onShowMore}>
          +{remaining} more
        </MoreButton>
      )}
    </Preview>
  )
}

export interface EnumSourceFieldProps {
  enumValues: NormalizedData[] | undefined
  enumResolver: AttributeData['enumResolver']
  enumResolverSettings: AttributeData['enumResolverSettings']
  onChangeEnum: (value: NormalizedData[] | undefined) => void
  onChangeResolver: (name: string | undefined) => void
  onChangeResolverSettings: (settings: Record<string, any> | undefined) => void
}

export const EnumSourceField: FC<EnumSourceFieldProps> = ({
  enumValues,
  enumResolver,
  enumResolverSettings,
  onChangeEnum,
  onChangeResolver,
  onChangeResolverSettings,
}) => {
  const { data: resolvers = [], isLoading, isError } = useListEnumsQuery()
  const [isDebugOpen, setIsDebugOpen] = useState(false)
  const openDebug = () => setIsDebugOpen(true)

  const sourceOptions = [
    { value: CUSTOM_ENUM_SOURCE, label: 'Custom' },
    ...resolvers.map((resolver: EnumResolverInfo) => ({
      value: resolver.name,
      label: startCase(resolver.name),
    })),
  ]

  const selectedSource = enumResolver || CUSTOM_ENUM_SOURCE
  const selectedResolver = resolvers.find((resolver) => resolver.name === enumResolver)
  const settingsFields = selectedResolver?.settingsForm || EMPTY_FIELDS
  const settings = (enumResolverSettings as SimpleFormValueDict) || {}
  const contextMessage = getEnumContextParams(selectedResolver?.acceptedParams)
    .map((name) => CONTEXT_PARAM_MESSAGES[name])
    .join(' ')

  const handleSourceChange = (value: string[]) => {
    const source = value[0]
    if (!source || source === CUSTOM_ENUM_SOURCE) {
      onChangeResolver(undefined)
      onChangeResolverSettings(undefined)
    } else {
      onChangeResolver(source)
      onChangeResolverSettings(undefined)
      onChangeEnum(undefined)
    }
  }

  return (
    <Container>
      <Dropdown
        value={[selectedSource]}
        options={sourceOptions}
        onChange={handleSourceChange}
        disabled={isLoading || isError}
        minSelected={1}
        searchOnNumber={SEARCH_THRESHOLD}
        widthExpand
      />
      {selectedSource === CUSTOM_ENUM_SOURCE ? (
        <EnumEditor
          values={enumValues || []}
          onChange={(v) => onChangeEnum(v?.length ? v : undefined)}
        />
      ) : (
        <>
          {!isLoading && !selectedResolver && (
            <Message>
              Resolver "{enumResolver}" is not available on this server. Options will be empty.
            </Message>
          )}
          {contextMessage && (
            <ClickableInfoMessage
              message={contextMessage}
              role="button"
              tabIndex={0}
              onClick={openDebug}
              onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openDebug()
                }
              }}
            />
          )}
          {settingsFields.length > 0 && (
            <SimpleForm
              key={enumResolver}
              fields={settingsFields}
              values={settings}
              onChange={onChangeResolverSettings}
            />
          )}
          {selectedResolver && (
            <>
              <EnumResolverPreview
                resolver={selectedResolver.name}
                acceptedParams={selectedResolver.acceptedParams}
                settings={settings}
                onShowMore={openDebug}
              />
              <Button
                variant="text"
                icon="bug_report"
                label="Debug"
                onClick={openDebug}
                style={{ alignSelf: 'flex-start' }}
              />
            </>
          )}
          {isDebugOpen && selectedResolver && (
            <EnumDebugDialog
              resolver={selectedResolver}
              settings={settings}
              onClose={() => setIsDebugOpen(false)}
            />
          )}
        </>
      )}
    </Container>
  )
}
