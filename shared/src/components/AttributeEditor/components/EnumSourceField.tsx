import { FC } from 'react'
import { startCase } from 'lodash'
import styled from 'styled-components'
import { Dropdown, FormRow } from '@ynput/ayon-react-components'

import { EnumEditor } from '@shared/components/EnumEditor/EnumEditor'
import type { NormalizedData } from '@shared/components/EnumEditor/EnumEditor'
import { FormField } from '@shared/components/SimpleFormDialog/SimpleFormDialog'
import type { SimpleFormValue } from '@shared/components/SimpleFormDialog/SimpleFormDialog'
import { useListEnumsQuery } from '@shared/api'
import type { AttributeData, EnumResolverInfo, SimpleFormField } from '@shared/api'

const CUSTOM_ENUM_SOURCE = '__custom__'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
  flex: 1;
`

const Message = styled.span`
  color: var(--md-sys-color-outline);
`

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
        </>
      )}
    </Container>
  )
}
