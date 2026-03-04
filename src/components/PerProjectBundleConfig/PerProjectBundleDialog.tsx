import { EnumItem } from '@shared/api'

import { Button, Dialog, Dropdown, SaveButton, ScrollPanel } from '@ynput/ayon-react-components'
import { FC, useEffect, useState, useMemo } from 'react'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import { useGetProjectBundleInfoQuery } from '@queries/bundles/getBundles'
import {
  useSetProjectBundleMutation,
  useUnsetProjectBundleMutation,
} from '@queries/bundles/updateBundles'
import clsx from 'clsx'
import InfoMessage from '@components/InfoMessage'

//
// Styled Components
//

const StyledDialog = styled(Dialog)`
  max-height: unset;

  .body {
    gap: 16px;
    padding-top: 0;
  }

  h2 {
    margin-bottom: 10px;
    margin-top: 14px;
  }
`

const AddonForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: opacity 0.2s ease;
  padding-right: 8px;

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

type AddonMetadata = {
  name: string
  label: string
  options: EnumItem[]
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
  isFrozen?: boolean
  onClose: () => void
}

const PerProjectBundleDialog: FC<PerProjectBundleDialogProps> = ({
  projectName,
  variant,
  isFrozen,
  onClose,
}) => {
  const [formData, setFormData] = useState<ProjectBundleForm | null>(null)

  const {
    data,
    isFetching: queryFetching,
    error: queryError,
  } = useGetProjectBundleInfoQuery({
    projectName,
    variant: variant as 'production' | 'staging',
  })

  const [setProjectBundle, { isLoading: isSetting, error: setError }] =
    useSetProjectBundleMutation()
  const [unsetProjectBundle, { isLoading: isUnsetting, error: unsetError }] =
    useUnsetProjectBundleMutation()

  const isLoading = queryFetching
  const isUpdating = isSetting || isUnsetting
  const error = queryError || setError || unsetError
  // @ts-ignore
  const errorMessage = error?.data?.detail || error?.message || (error ? 'An error occurred' : null)

  useEffect(() => {
    if (data) {
      setFormData(data as ProjectBundleForm)
    }
  }, [data])

  const handleUnfreeze = async () => {
    // Unfreeze deletes the project bundle
    try {
      await unsetProjectBundle({
        projectName,
        variant: variant as 'production' | 'staging',
      }).unwrap()
      toast.success(`Project bundle for ${projectName} unset successfully`)
      onClose()
    } catch (error: any) {
      console.error('Error unsetting project bundle:', error)
      toast.error(`Error unsetting project bundle: ${error.data?.detail || error.message || error}`)
    }
  }

  const handleFreeze = async () => {
    // Create or update the project bundle
    if (!formData) return
    try {
      // do not send back addonMetadata (ignored by the server)
      await setProjectBundle({
        projectName,
        variant: variant as 'production' | 'staging',
        projectBundle: {
          addons: formData.addons as { [key: string]: string },
          installerVersion: formData.installerVersion || undefined,
          dependencyPackages: {
            windows:
              formData.dependencyPackages.windows === '__none__'
                ? null
                : formData.dependencyPackages.windows,
            linux:
              formData.dependencyPackages.linux === '__none__'
                ? null
                : formData.dependencyPackages.linux,
            darwin:
              formData.dependencyPackages.darwin === '__none__'
                ? null
                : formData.dependencyPackages.darwin,
          } as { [key: string]: string },
        },
      }).unwrap()
      toast.success(`Project bundle for ${projectName} set successfully`)
      onClose()
    } catch (error: any) {
      console.error('Error setting project bundle:', error)
      toast.error(`Error setting project bundle: ${error.data?.detail || error.message || error}`)
    }
  }

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

  const footer = useMemo(
    () => (
      <>
        {isFrozen && (
          <Button onClick={handleUnfreeze} disabled={isLoading || isUpdating} label="Unfreeze" />
        )}
        <SaveButton
          onClick={handleFreeze}
          active={!isLoading && !isUpdating}
          saving={isUpdating}
          label={isFrozen ? 'Update Freeze' : 'Freeze'}
          icon="lock"
        />
      </>
    ),
    [isLoading, isUpdating, handleFreeze, handleUnfreeze],
  )

  return (
    <StyledDialog
      onClose={onClose}
      isOpen
      header={`Freeze ${variant} bundle for ${projectName}`}
      size="md"
      style={{ height: '80vh'}}
      footer={footer}
    >
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px',  width: "100%", height: "100%" }}>
      <ScrollPanel style={{ flexGrow: 1, background: 'transparent' }}>
      <AddonForm className={clsx({ loading: isLoading })}>
        <div className="addon-row">
          <label htmlFor="installerVersion">Launcher Version</label>
          <Dropdown
            id="installerVersion"
            options={formData?.installerOptions.map((opt) => ({ label: opt, value: opt })) || []}
            value={formData?.installerVersion ? [formData.installerVersion] : []}
            onChange={handleInstallerChange}
            placeholder="Select launcher version"
            style={{ minWidth: '200px' }}
            disabled={isLoading}
          />
        </div>
      </AddonForm>

      <h2>Dependency Packages</h2>
      <AddonForm className={clsx({ loading: isLoading })}>
        {['windows', 'linux', 'darwin'].map((platform) => {
          const options = [{ label: 'None', value: '__none__' }]

          if (formData?.dependencyPackageOptions[platform]) {
            for (const option of formData.dependencyPackageOptions[platform]) {
              options.push({ label: option, value: option })
            }
          }

          return (
            <div className="addon-row" key={platform}>
              <label>{platform.charAt(0).toUpperCase() + platform.slice(1)}</label>
              <Dropdown
                options={options}
                value={
                  formData?.dependencyPackages[platform]
                    ? [formData.dependencyPackages[platform]]
                    : ['__none__']
                }
                onChange={(value) => handleDependencyPackageChange(value, platform)}
                style={{ minWidth: '300px' }}
                multiSelect={false}
                disabled={isLoading}
              />
            </div>
          )
        })}
      </AddonForm>

      <h2>Addons</h2>
      <AddonForm className={clsx({ loading: isLoading })}>
        {formData?.addonMetadata.map((meta: AddonMetadata) => {
          return (
            <div className="addon-row" key={meta.name}>
              <label htmlFor={meta.name}>{meta.label}</label>
              <Dropdown
                id={meta.name}
                options={meta.options}
                value={[formData.addons[meta.name] || '__inherit__']}
                onChange={(value) => handleAddonChange(value, meta.name)}
                placeholder="Select version"
                style={{ minWidth: '200px' }}
                disabled={isLoading}
              />
            </div>
          )
        })}
      </AddonForm>
      </ScrollPanel>
      {errorMessage && <InfoMessage variant="error" message={errorMessage} />}
    </div>
    </StyledDialog>
  )
}

export default PerProjectBundleDialog
