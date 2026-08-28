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
import { isEnumIconImage } from '@shared/util/attributeEnum'

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

  if (isLoading) return <Message>Loading options…</Message>
  if (isError) return <Message>Could not load options for "{resolver}".</Message>
  if (!options.length) return <Message>This enum currently has no items.</Message>

  const hidden = options.length - PREVIEW_LIMIT

  return (
    <Preview>
      {options.slice(0, PREVIEW_LIMIT).map((option) => (
        <PreviewItem key={String(option.value)}>
          {isEnumIconImage(option.icon as string) ? (
            <img src={option.icon as string} alt="" />
          ) : (
            option.icon && <Icon icon={option.icon as string} style={{ color: option.color }} />
          )}
          <span className="label">{option.label}</span>
        </PreviewItem>
      ))}
      {hidden > 0 && <Message>+{hidden} more</Message>}
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
