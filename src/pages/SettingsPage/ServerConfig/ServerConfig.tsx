import { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom' // added import for portal
import ServerConfigUpload from './ServerConfigUpload' // added import for upload component

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

  /* target bg and studio logo fields and hide */
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
  const formContainerRef = useRef<HTMLDivElement>(null) // added ref for portal
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

  const bgFormEl = formContainerRef.current?.querySelector(
    '[data-schema-id="root_customization_login_background"] .form-inline-field-widget',
  )

  const logoFormEl = formContainerRef.current?.querySelector(
    '[data-schema-id="root_customization_studio_logo"] .form-inline-field-widget',
  )

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

        <StyledScrollPanel className="transparent" ref={formContainerRef}>
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
      {bgFormEl &&
        ReactDOM.createPortal(
          <ServerConfigUpload
            fileType="login_background"
            fileName={originalData.customization?.login_background}
          />,
          bgFormEl,
        )}
      {logoFormEl &&
        ReactDOM.createPortal(
          <ServerConfigUpload
            fileType="studio_logo"
            fileName={originalData.customization?.studio_logo}
          />,
          logoFormEl,
        )}
    </>
  )

  /*
  
        onSetBreadcrumbs={onSetBreadcrumbs}
        breadcrumbs={breadcrumbs}
        context={context}
  */
}

export default ServerConfig
