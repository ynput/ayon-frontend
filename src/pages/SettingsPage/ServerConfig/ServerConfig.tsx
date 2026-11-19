import { useState, useEffect, useMemo } from 'react'
import ReactDOM from 'react-dom'
import ServerConfigUpload from './ServerConfigUpload'
import SettingsEditor from '@containers/SettingsEditor'
import { Spacer, Toolbar, SaveButton } from '@ynput/ayon-react-components'
import {
  useGetServerConfigQuery,
  useGetServerConfigOverridesQuery,
  useGetServerConfigSchemaQuery,
  useSetServerConfigMutation,
} from '@shared/api'
import { ServerConfigModel } from '@shared/api'
import styled from 'styled-components'
import { toast } from 'react-toastify'
import usePortalElements from '@hooks/usePortalElements'
import {
  SettingsFormSection,
  SettingsFormTitle,
  SettingsFormScrollPanel,
  SettingsFormContent,
} from '../SettingsFormPage.styled'

const StyledContent = styled(SettingsFormContent)`
  [data-schema-id='root_customization_login_background'],
  [data-schema-id='root_customization_studio_logo'] {
    .form-field {
      display: none;
    }
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
          frontend_flags: originalData?.customization?.frontend_flags || [],
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
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      customization: {
        ...prev.customization,
        login_background: backgroundFileName,
        studio_logo: logoFileName,
      },
    }))
  }, [backgroundFileName, logoFileName, setFormData])

  const onSave = async () => {
    try {
      await setServerConfig({ serverConfigModel: formData }).unwrap()
    } catch (error) {
      toast.error('Failed to save server config')
    }
  }
  const handleClearUpload = async (field: 'login_background' | 'studio_logo') => {
    try {
      // clear the filename in the formData and update the server config
      // local fileName state will be updated by the useEffect above
      await setServerConfig({
        serverConfigModel: {
          ...formData,
          customization: {
            ...formData.customization,
            [field]: '',
          },
        },
      }).unwrap()
    } catch (error) {
      toast.error('Failed to clear upload')
    }
  }

  const settingsEditor = useMemo(() => {
    if (isLoadingData || isLoadingSchema || isLoadingOverrides) {
      return null
    }
    return (
      // @ts-ignore
      <SettingsEditor
        schema={configSchema}
        originalData={originalData}
        formData={formData}
        changedKeys={changedKeys}
        overrides={configOverrides}
        onChange={setFormData}
        onSetChangedKeys={setChangedKeys}
      />
    )
  }, [
    isLoadingData,
    isLoadingSchema,
    isLoadingOverrides,
    configSchema,
    originalData,
    formData,
    changedKeys,
    configOverrides,
    setFormData,
    setChangedKeys,
  ])

  return (
    <>
      <main>
        <SettingsFormSection direction="column">
          <Toolbar>
            <SettingsFormTitle>Global settings</SettingsFormTitle>
            <Spacer />
            <SaveButton
              active={!!changedKeys.length}
              onClick={onSave}
              saving={isSaving}
              label="Save changes"
            />
          </Toolbar>

          <SettingsFormScrollPanel className="transparent">
            <StyledContent ref={containerRef}>{settingsEditor}</StyledContent>
          </SettingsFormScrollPanel>
        </SettingsFormSection>
      </main>
      {bgElement &&
        ReactDOM.createPortal(
          <ServerConfigUpload
            fileType="login_background"
            fileName={backgroundFileName}
            setFileName={setBackgroundFileName}
            onClear={() => handleClearUpload('login_background')}
          />,
          bgElement,
        )}
      {logoElement &&
        ReactDOM.createPortal(
          <ServerConfigUpload
            fileType="studio_logo"
            fileName={logoFileName}
            setFileName={setLogoFileName}
            onClear={() => handleClearUpload('studio_logo')}
          />,
          logoElement,
        )}
    </>
  )
}

export default ServerConfig
