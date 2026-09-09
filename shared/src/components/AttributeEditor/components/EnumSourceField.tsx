import { FC, useMemo } from 'react'
import { startCase } from 'lodash'
import styled from 'styled-components'
import { Dropdown, FormRow, Icon } from '@ynput/ayon-react-components'

import { EnumEditor } from '@shared/components/EnumEditor/EnumEditor'
import type { NormalizedData } from '@shared/components/EnumEditor/EnumEditor'
import { FormField } from '@shared/components/SimpleFormDialog/SimpleFormDialog'
import type { SimpleFormValue } from '@shared/components/SimpleFormDialog/SimpleFormDialog'
import { useListEnumsQuery } from '@shared/api'
import type { AttributeData, EnumResolverInfo, SimpleFormField } from '@shared/api'
import { useAttributeEnumOptions } from '@shared/hooks/useAttributeEnumOptions'
import { getEnumItemIcon, isEnumIconImage } from '@shared/util/attributeEnum'

const CUSTOM_ENUM_SOURCE = '__custom__'
const PREVIEW_LIMIT = 5

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
  gap: var(--base-gap-small);
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
  settings: Record<string, any>
}

const EnumResolverPreview: FC<EnumResolverPreviewProps> = ({ resolver, settings }) => {
  const data = useMemo(
    () => ({ enumResolver: resolver, enumResolverSettings: settings } as AttributeData),
    [resolver, settings],
  )
  const { options, isLoading, isError } = useAttributeEnumOptions(data)

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
        <Message>Could not load options for "{resolver}".</Message>
      </Preview>
    )
  if (!options.length)
    return (
      <Preview>
        <Message>This enum currently has no items.</Message>
      </Preview>
    )

  const hidden = options.length - PREVIEW_LIMIT
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
      {hidden > 0 && <MoreMessage>+{hidden} more</MoreMessage>}
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
  const settingsFields = selectedResolver?.settingsForm || []
  const settings = (enumResolverSettings as Record<string, any>) || {}

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

  const handleSettingChange = (name: string, value: SimpleFormValue) => {
    onChangeResolverSettings({ ...settings, [name]: value })
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
          {settingsFields.map((field: SimpleFormField) => (
            <FormRow key={field.name} label={field.label || startCase(field.name)}>
              <FormField
                field={field}
                value={settings[field.name]}
                onChange={(value) => handleSettingChange(field.name, value)}
              />
            </FormRow>
          ))}
          {selectedResolver && (
            <EnumResolverPreview resolver={selectedResolver.name} settings={settings} />
          )}
        </>
      )}
    </Container>
  )
}
