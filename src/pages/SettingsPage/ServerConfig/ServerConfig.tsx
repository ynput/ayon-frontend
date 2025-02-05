import { useState, useEffect } from 'react'

import SettingsEditor from '@containers/SettingsEditor'
import { Spacer, Section, Toolbar, ScrollPanel, SaveButton } from '@ynput/ayon-react-components'

// Add RTK query hooks and mutation hook imports
import {
  useGetServerConfigQuery,
  useGetServerConfigOverridesQuery,
  useGetServerConfigSchemaQuery,
} from '@queries/config/getConfig'
import { useSetServerConfigMutation } from '@queries/config/updateConfig'
import { ServerConfigModel } from '@api/rest/config'
import styled from 'styled-components'
import { toast } from 'react-toastify'

const StyledSection = styled(Section)`
  padding: var(--padding-m);

  align-items: center;

  & > * {
    max-width: 800px;
  }
`

const ServerConfig = () => {
  // Use RTK query hooks instead of axios calls
  const { data: originalData = {}, isLoading: isLoadingData } = useGetServerConfigQuery()
  const { data: configOverrides = {}, isLoading: isLoadingOverrides } =
    useGetServerConfigOverridesQuery()
  const { data: configSchema = {}, isLoading: isLoadingSchema } = useGetServerConfigSchemaQuery()

  const [setServerConfig, { isLoading: isSaving }] = useSetServerConfigMutation()

  const [formData, setFormData] = useState<ServerConfigModel>({})
  const [changedKeys, setChangedKeys] = useState([])

  useEffect(() => {
    if (!isLoadingData && !isLoadingSchema && !isLoadingOverrides) {
      setFormData(originalData)
      setChangedKeys([])
    }
  }, [
    isLoadingData,
    isLoadingSchema,
    isLoadingOverrides,
    originalData,
    configSchema,
    configOverrides,
  ])

  const onSave = async () => {
    try {
      await setServerConfig({ serverConfigModel: formData }).unwrap()
    } catch (error) {
      toast.error('Failed to save server config')
    }
  }

  return (
    <StyledSection direction="column">
      <Toolbar>
        <Spacer />
        <SaveButton
          active={!!changedKeys.length}
          onClick={onSave}
          saving={isSaving}
          label="Save server config"
        />
      </Toolbar>
      <Section>
        <ScrollPanel style={{ flexGrow: 1, padding: 8 }} className="transparent">
          {/* @ts-ignore */}
          <SettingsEditor
            schema={configSchema}
            originalData={originalData}
            formData={formData}
            changedKeys={changedKeys}
            overrides={configOverrides}
            onChange={setFormData}
            onSetChangedKeys={setChangedKeys}
          />
        </ScrollPanel>
      </Section>
    </StyledSection>
  )

  /*
  
        onSetBreadcrumbs={onSetBreadcrumbs}
        breadcrumbs={breadcrumbs}
        context={context}
  */
}

export default ServerConfig
