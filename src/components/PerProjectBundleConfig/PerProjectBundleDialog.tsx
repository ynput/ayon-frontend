import { useDispatch } from 'react-redux'
import api from '@shared/api'

import {
  Button,
  Dialog,
  DialogProps,
  Dropdown,
  SaveButton,
} from '@ynput/ayon-react-components'
import axios from 'axios'
import { FC, useEffect, useState, useMemo } from 'react'
import { toast } from 'react-toastify'
import styled from 'styled-components'

const StyledDialog = styled(Dialog)`
  max-height: unset;

  .body {
    gap: 16px;
    padding-top: 0;
  }
`


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
  addonMetadata: AddonMetadata[]

}

interface PerProjectBundleDialogProps extends Partial<DialogProps> {
  projectName: string
  variant: string
  onClose: () => void
}


const PerProjectBundleDialog: FC<PerProjectBundleDialogProps> = ({
  projectName,
  variant,
  onClose,
  ...props
}) => {
  const dispatch = useDispatch()

  const [formData, setFormData] = useState<ProjectBundleForm | null>(null)
  const [isLoading, setIsLoading] = useState(true)



  const handleUnfreeze = async () => {
    // Unfreeze deletes the project bundle
    setIsLoading(true)
    try {
      await axios.delete(`/api/projects/${projectName}/bundle?variant=${variant}`)
      toast.success(`Project bundle for ${projectName} unset successfully`)
      dispatch(api.util.invalidateTags(['addonSettingsList', 'addonSettingsOverrides', 'addonSettings']))
      onClose()
    } catch (error: any) {
      console.error('Error unsetting project bundle:', error)
      toast.error(`Error unsetting project bundle: ${error.message || error}`)
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
      dispatch(api.util.invalidateTags(['addonSettingsList', 'addonSettingsOverrides', 'addonSettings']))
      onClose()
    } catch (error: any) {
      console.error('Error setting project bundle:', error)
      toast.error(`Error setting project bundle: ${error.message || error}`)
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


  const addonForm = useMemo(() => {
    if (!formData) return null

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {formData.addonMetadata.map((meta: AddonMetadata) => {
          return (
            <div key={meta.name} style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor={meta.name} style={{ display: 'block', marginBottom: '4px' }}>
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

      </div>
    )

  }, [formData])



  return (
    <StyledDialog
      {...props}
      onClose={onClose}
      isOpen
      header={`Freeze ${variant} bundle for ${projectName}`}
      size="sm"
      footer={
        <>
          <Button onClick={handleUnfreeze} disabled={isLoading} label='Unfreeze' />
          <SaveButton onClick={handleFreeze} active={true} saving={isLoading}>
            Freeze
          </SaveButton>
        </>
      }
    >
      {isLoading && <div>Loading...</div>}
      {!isLoading && formData && addonForm}

    </StyledDialog>
  )
}

export default PerProjectBundleDialog
