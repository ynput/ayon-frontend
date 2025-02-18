import { useState, useEffect, useMemo } from 'react'
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
  // [data-schema-id='root_customization_login_background'],
  // [data-schema-id='root_customization_studio_logo'] {
  //   .form-field {
  //     display: none;
  //   }
  // }
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
  const { bgElement, logoElement, containerRef } = usePortalElements()

  const { data: originalData = {}, isLoading: isLoadingData } = useGetServerConfigQuery()
  const { data: configOverrides = {}, isLoading: isLoadingOverrides } =
    useGetServerConfigOverridesQuery()
  const { data: configSchema = {}, isLoading: isLoadingSchema } = useGetServerConfigSchemaQuery()

  const [setServerConfig, { isLoading: isSaving }] = useSetServerConfigMutation()

  const [formData, setFormData] = useState<ServerConfigModel>({})
  const [changedKeys, setChangedKeys] = useState([])
  const [backgroundFileName, setBackgroundFileName] = useState(
    originalData?.customization?.login_background || '',
  )
  const [logoFileName, setLogoFileName] = useState(originalData?.customization?.studio_logo || '')

  useEffect(() => {
    if (!isLoadingData && !isLoadingSchema && !isLoadingOverrides) {
//      setFormData(originalData)
      setChangedKeys([])
      setBackgroundFileName(originalData?.customization?.login_background || '')
      setLogoFileName(originalData?.customization?.studio_logo || '')

setFormData({
        ...originalData,
        customization: {
          login_background: originalData?.customization?.login_background || '',
          studio_logo: originalData?.customization?.studio_logo || '',
          motd: originalData?.customization?.motd || '',
        },
      })

    }
  }, [
    isLoadingData,
    isLoadingSchema,
    isLoadingOverrides,
    originalData,
    configSchema,
    configOverrides,
  ])

  // sync filenames with formData
  // when a new file is uploaded, update the formData with the new filename
  // useEffect(() => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     customization: {
  //       ...prev.customization,
  //       login_background: backgroundFileName,
  //       studio_logo: logoFileName,
  //     },
  //   }))
  // }, [backgroundFileName, logoFileName, setFormData])


  const onChange = (data: ServerConfigModel) => {
    console.log('data', data)
    setFormData(data)
  }

  const onSetChangedKeys = (keys: string[]) => {
    console.log('keys', keys)
    setChangedKeys(keys)
  }

  const onSave = async () => {
    try {
      await setServerConfig({ serverConfigModel: formData }).unwrap()
    } catch (error) {
      toast.error('Failed to save server config')
    }
  }


  const settingsEditor = useMemo(() => {
    if (isLoadingData || isLoadingSchema || isLoadingOverrides) {
      return null
    }
    return (
      <SettingsEditor
        schema={configSchema}
        originalData={originalData}
        formData={formData}
        changedKeys={changedKeys}
        overrides={configOverrides}
        onChange={onChange}
        onSetChangedKeys={onSetChangedKeys}
      />
    )
  }, [configSchema, formData, changedKeys, configOverrides, onChange, onSetChangedKeys])


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
          {settingsEditor}
        </StyledScrollPanel>
      </StyledSection>

    </>
  )
}

export default ServerConfig


/*
      {bgElement &&
        ReactDOM.createPortal(
          <ServerConfigUpload
            fileType="login_background"
            fileName={backgroundFileName}
            setFileName={setBackgroundFileName}
          />,
          bgElement,
        )}
      {logoElement &&
        ReactDOM.createPortal(
          <ServerConfigUpload
            fileType="studio_logo"
            fileName={logoFileName}
            setFileName={setLogoFileName}
          />,
          logoElement,
        )}
*/
