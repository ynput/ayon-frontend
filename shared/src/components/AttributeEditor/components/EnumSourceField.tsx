import { FC, useMemo } from 'react'
import { startCase } from 'lodash'
import styled from 'styled-components'
import { Dropdown, Icon } from '@ynput/ayon-react-components'

import { EnumEditor } from '@shared/components/EnumEditor/EnumEditor'
import type { NormalizedData } from '@shared/components/EnumEditor/EnumEditor'
import { SimpleForm } from '@shared/components/SimpleForm'
import type { SimpleFormValueDict } from '@shared/components/SimpleForm'
import { useListEnumsQuery } from '@shared/api'
import type { AttributeData, EnumResolverInfo, SimpleFormField } from '@shared/api'
import { useAttributeEnumOptions } from '@shared/hooks/useAttributeEnumOptions'
import { getEnumItemIcon, getSelectableEnumItems, isEnumIconImage } from '@shared/util/attributeEnum'

const CUSTOM_ENUM_SOURCE = '__custom__'
const PREVIEW_LIMIT = 5
const EMPTY_FIELDS: SimpleFormField[] = []
const EMPTY_PREVIEW_MESSAGE = 'No preview items found.'
const CONTEXT_PARAMS_MESSAGE =
  'This could be because in context parameters (project_name) are required to get the items.'

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

const PreviewItem = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  overflow: hidden;
  height: 20px;

  .label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  img {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    object-fit: cover;
  }

  .icon-slot {
    flex: none;
    width: 20px;
  }
`

const MoreMessage = styled(Message)`
  display: flex;
  align-items: center;
  height: 20px;
`

const SkeletonItem = styled(PreviewItem)`
  border-radius: var(--border-radius-m);

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
}

const EnumResolverPreview: FC<EnumResolverPreviewProps> = ({
  resolver,
  acceptedParams,
  settings,
}) => {
  const data = useMemo(
    () => ({ enumResolver: resolver, enumResolverSettings: settings } as AttributeData),
    [resolver, settings],
  )
  const { options: allOptions, isLoading, isError, errorMessage } = useAttributeEnumOptions(data)
  const options = getSelectableEnumItems(allOptions)

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
          {'project_name' in (acceptedParams || {}) && ` ${CONTEXT_PARAMS_MESSAGE}`}
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
        <PreviewItem key={String(option.value)}>
          {isEnumIconImage(icon) ? (
            <img src={icon} alt="" />
          ) : icon ? (
            <Icon icon={icon} style={{ color: option.color }} />
          ) : (
            hasIcons && <span className="icon-slot" />
          )}
          <span className="label">{option.label}</span>
        </PreviewItem>
      ))}
      {remaining > 0 && <MoreMessage>+{remaining} more</MoreMessage>}
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

  // Seed only: SimpleForm reseeds on values identity, so echoing settings back would loop
  const initialSettings = useMemo(
    () => (enumResolverSettings as SimpleFormValueDict) || {},
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enumResolver],
  )

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
          {settingsFields.length > 0 && (
            <SimpleForm
              key={enumResolver}
              fields={settingsFields}
              values={initialSettings}
              onChange={onChangeResolverSettings}
            />
          )}
          {selectedResolver && (
            <EnumResolverPreview
              resolver={selectedResolver.name}
              acceptedParams={selectedResolver.acceptedParams}
              settings={settings}
            />
          )}
        </>
      )}
    </Container>
  )
}
