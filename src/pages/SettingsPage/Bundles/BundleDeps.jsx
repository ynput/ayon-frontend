import { FormLayout, Dialog } from '@ynput/ayon-react-components'
import React, { useState } from 'react'
import BundleDepPackage from './BundleDepPackage'
import { useUpdateBundleMutation } from '@queries/bundles/updateBundles'
import { toast } from 'react-toastify'
import { useListDependencyPackagesQuery } from '@queries/dependencyPackages/getDependencyPackages'
import BundleDepsPicker from './BundleDepsPicker'

const BundleDeps = ({ bundle, onChange }) => {
  const initPackageForm = {
    platform: null,
    file: null,
  }
  const [updatePackageForm, setUpdatePackageForm] = useState(initPackageForm)

  // get dep packages from server
  const { data: { packages = [] } = {} } = useListDependencyPackagesQuery()

  const [updateBundle, { isLoading: isUpdating }] = useUpdateBundleMutation()

  const handleCloseForm = () => {
    setUpdatePackageForm(initPackageForm)
  }

  const setBundleDepPackage = async (platform, packageName) => {
    const newDeps = {
      ...bundle.dependencyPackages,
      [platform]: packageName || null,
    }

    if (onChange) {
      onChange(newDeps)
      handleCloseForm()
      return
    }

    // update bundle
    const patch = {
      ...bundle,
      dependencyPackages: newDeps,
    }

    // update bundle on server
    try {
      await updateBundle({ name: bundle.name, patch, data: patch })
      handleCloseForm()
      toast.success('Bundle Dependency Package updated')
    } catch (error) {
      console.error(error)
      toast.error('ERROR: Bundle Dependency Package not updated')
    }
  }

  const platforms = [
    {
      id: 'windows',
      label: 'Windows',
    },
    {
      id: 'linux',
      label: 'Linux',
    },
    {
      id: 'darwin',
      label: 'MacOS',
    },
  ]

  return (
    <>
      <Dialog
        header={'Update Dependency Package'}
        isOpen={!!updatePackageForm.platform}
        onClose={handleCloseForm}
        size="sm"
        style={{ width: '500px' }}
      >
        <BundleDepsPicker
          packages={packages}
          value={updatePackageForm}
          initPackage={bundle?.dependencyPackages?.[updatePackageForm?.platform] || null}
          onChange={(v) => setUpdatePackageForm({ ...updatePackageForm, file: v[0] || null })}
          isUpdating={isUpdating}
          onSubmit={() => setBundleDepPackage(updatePackageForm?.platform, updatePackageForm?.file)}
          onCancel={handleCloseForm}
        />
      </Dialog>
      <section style={{ flex: 1, overflow: 'hidden' }}>
        <h2>Dependency Packages</h2>
        {bundle && (
          <FormLayout style={{ maxWidth: 'max-content', minWidth: 300 }}>
            {platforms.map((platform) => (
              <BundleDepPackage
                key={platform.id}
                label={platform.label}
                onEdit={() =>
                  setUpdatePackageForm({
                    platform: platform.id,
                    file: bundle?.dependencyPackages?.[platform.id] || null,
                  })
                }
              >
                {bundle?.dependencyPackages?.[platform.id]}
              </BundleDepPackage>
            ))}
          </FormLayout>
        )}
      </section>
    </>
  )
}

export default BundleDeps
