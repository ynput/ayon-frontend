import { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import ServerConfigUpload from './ServerConfigUpload'
import SettingsEditor from '@containers/SettingsEditor'
import { Spacer, Section, Toolbar, ScrollPanel, SaveButton } from '@ynput/ayon-react-components'
import {
  useGetServerConfigQuery,
  useGetServerConfigOverridesQuery,
  useGetServerConfigSchemaQuery,
} from '@queries/config/getConfig'
import { useSetServerConfigMutation } from '@queries/config/updateConfig'
import { ServerConfigModel } from '@api/rest/config'
import styled from 'styled-components'
import { toast } from 'react-toastify'
import usePortalElements from '@hooks/usePortalElements'

const StyledSection = styled(Section)`
  padding: var(--padding-m);
  align-items: center;
  & > * {
    max-width: 800px;
  }
  [data-schema-id='root_customization_login_background'],
  [data-schema-id='root_customization_studio_logo'] {
    .form-field {
      display: none;
    }
  }
`

const StyledScrollPanel = styled(ScrollPanel)`
  flex-grow: 1;
  padding: 8px;
  height: 100%;
  overflow: auto;
  & > * {
    overflow: visible;
    position: relative;
  }
`

const ServerConfig = () => {
  // Replace local portal logic with custom hook
  const { bgElement, logoElement, containerRef } = usePortalElements()

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
    <>
      <StyledSection direction="column" style={{ overflow: 'hidden', paddingBottom: 0 }}>
        <Toolbar>
          <Spacer />
          <SaveButton
            active={!!changedKeys.length}
            onClick={onSave}
            saving={isSaving}
            label="Save server config"
          />
        </Toolbar>

        <StyledScrollPanel className="transparent" ref={containerRef}>
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
        </StyledScrollPanel>
      </StyledSection>
      {bgElement &&
        ReactDOM.createPortal(
          <ServerConfigUpload
            fileType="login_background"
            fileName={originalData.customization?.login_background}
          />,
          bgElement,
        )}
      {logoElement &&
        ReactDOM.createPortal(
          <ServerConfigUpload
            fileType="studio_logo"
            fileName={originalData.customization?.studio_logo}
          />,
          logoElement,
        )}
    </>
  )
}

export default ServerConfig
