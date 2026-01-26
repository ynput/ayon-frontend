import { useDispatch } from 'react-redux'
import api from '@shared/api'

import {
  Button,
  Dialog,
  Dropdown,
  SaveButton,
} from '@ynput/ayon-react-components'
import axios from 'axios'
import { FC, useEffect, useState, useMemo } from 'react'
import { toast } from 'react-toastify'
import styled from 'styled-components'


//
// Styled Components
//

const StyledDialog = styled(Dialog)`
  max-height: unset;

  .body {
    gap: 16px;
    padding-top: 0;
  }
`

const AddonForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  .addon-row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;

    label {
      display: bock;
    }

  }
`


//
// Hardcoded types are the best types
//


type AddonVersionOption = {
  label: string
  value: string
}

type AddonMetadata = {
  name: string
  label: string
  options: AddonVersionOption[]
}


type ProjectBundleForm = {
  addons: Record<string, string | null>
  installerVersion: string | null
  dependencyPackages: Record<string, string | null>
  // metadata to build the form
  addonMetadata: AddonMetadata[]
  installerOptions: string[]
  dependencyPackageOptions: Record<string, string[]>
}

interface PerProjectBundleDialogProps {
  projectName: string
  variant: string
  onClose: () => void
}


const PerProjectBundleDialog: FC<PerProjectBundleDialogProps> = ({
  projectName,
  variant,
  onClose,
}) => {
  const dispatch = useDispatch()

  const [formData, setFormData] = useState<ProjectBundleForm | null>(null)
  const [isLoading, setIsLoading] = useState(true)


  const invalidateTags = () => {
    dispatch(api.util.invalidateTags(['addonSettingsList', 'addonSettingsOverrides', 'addonSettings', 'addonSettingsSchema']))
  }


  // AXIOS TOUJOURS!

  const handleUnfreeze = async () => {
    // Unfreeze deletes the project bundle
    setIsLoading(true)
    try {
      await axios.delete(`/api/projects/${projectName}/bundle?variant=${variant}`)
      toast.success(`Project bundle for ${projectName} unset successfully`)
      invalidateTags()
      onClose()
    } catch (error: any) {
      console.error('Error unsetting project bundle:', error)
      toast.error(`Error unsetting project bundle: ${error.message || error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFreeze = async () => {
    // Create or update the project bundle
    if (!formData) return
    setIsLoading(true)
    try {
      // do not send back addonMetadata (ignored by the server)
      await axios.post(
        `/api/projects/${projectName}/bundle?variant=${variant}`,
        {
          addons: formData.addons,
          installerVersion: formData.installerVersion,
          dependencyPackages: formData.dependencyPackages
        }
      )
      toast.success(`Project bundle for ${projectName} set successfully`)
      invalidateTags()
      onClose()
    } catch (error: any) {
      console.error('Error setting project bundle:', error)
      toast.error(`Error setting project bundle: ${error.message || error}`)
    } finally {
      setIsLoading(false)
    }

  }

  useEffect(() => {
    axios.get(`/api/projects/${projectName}/bundle?variant=${variant}`).then((response) => {
      setFormData(response.data)
      setIsLoading(false)
    })
  }, [projectName])


  const handleAddonChange = (value: string[], addonName: string) => {
    setFormData((prev) => {
      if (!prev) {
        return prev
      }
      return {
        ...prev,
        addons: {
          ...prev.addons,
          [addonName]: value[0] || null,
        },
      }
    })
  }

  const handleInstallerChange = (value: string[]) => {
    setFormData((prev) => {
      if (!prev) {
        return prev
      }
      return {
        ...prev,
        installerVersion: value[0] || null,
      }
    })
  }

  const handleDependencyPackageChange = (value: string[], platform: string) => {
    setFormData((prev) => {
      if (!prev) {
        return prev
      }
      return {
        ...prev,
        dependencyPackages: {
          ...prev.dependencyPackages,
          [platform]: value[0] || null,
        },
      }
    })
  }


  const installerForm = useMemo(() => {
    if (!formData) return null
    return (
      <AddonForm>
        <div className='addon-row'>
          <label htmlFor='installerVersion'>
            Installer Version
          </label>
          <Dropdown
            id='installerVersion'
            options={formData.installerOptions.map((opt) => ({ label: opt, value: opt }))}
            value={formData.installerVersion ? [formData.installerVersion] : []}
            onChange={handleInstallerChange}
            placeholder="Select installer version"
            style={{ minWidth: '200px' }}
          />
        </div>
      </AddonForm>
    )
  }, [formData])


  const dependencyPackageForm = useMemo(() => {
    if (!formData) return null
    return (
      <AddonForm>
        {['windows', 'linux', 'darwin'].map((platform) => {

          const options = [{ label: 'None', value: null }]

          for (const option of formData.dependencyPackageOptions[platform]) {
            options.push({ label: option, value: option })
          }

          return (
            <div className='addon-row'>
              <label htmlFor='dp-windows'>
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </label>
              <Dropdown
                id='dp-windows'
                options={options}
                value={formData.dependencyPackages[platform] ? [formData.dependencyPackages[platform]] : []}
                onChange={(value) => handleDependencyPackageChange(value, platform)}
                style={{ minWidth: '300px' }}
              />
            </div>
          )

        })}
      </AddonForm>
    )
  }, [formData])

  const addonForm = useMemo(() => {
    if (!formData) return null
    return (
      <AddonForm>
        {formData.addonMetadata.map((meta: AddonMetadata) => {
          return (
            <div className='addon-row' key={meta.name}>
              <label htmlFor={meta.name}>
                {meta.label}
              </label>
              <Dropdown
                id={meta.name}
                options={meta.options}
                value={[formData.addons[meta.name] || '__inherit__']}
                onChange={(value) => handleAddonChange(value, meta.name)}
                placeholder="Select version"
                style={{ minWidth: '200px' }}
              />
            </div>
          )
        })}
      </AddonForm>
    )
  }, [formData])



  const footer = useMemo(() => (
    <>
      <Button onClick={handleUnfreeze} disabled={isLoading} label='Unfreeze' />
      <SaveButton onClick={handleFreeze} active={true} saving={isLoading} label='Freeze' />
    </>
  ), [isLoading, handleFreeze, handleUnfreeze])


  return (
    <StyledDialog
      onClose={onClose}
      isOpen
      header={`Freeze ${variant} bundle for ${projectName}`}
      size="md"
      footer={footer}
    >
      {(!isLoading && formData) ? (
        <>
          {installerForm}
          <h2>Dependency Packages</h2>
          {dependencyPackageForm}
          <h2>Addons</h2>
          {addonForm}
        </>
      ) : 'Loading...'}
    </StyledDialog>
  )
}

export default PerProjectBundleDialog
