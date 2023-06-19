import { useMemo, useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import {
  ScrollPanel,
  Section,
  InputText,
  Toolbar,
  Spacer,
  Button,
  Dropdown,
  FormLayout,
  FormRow,
} from '@ynput/ayon-react-components'

import { useGetInstallerListQuery } from '/src/services/installers'
import { useGetAddonListQuery } from '/src/services/addonList'
import { useCreateBundleMutation } from '/src/services/bundles'

import AddonVersions from './AddonVersions'

const BundleDetail = ({ bundle }) => {
  const { data: installerList = [] } = useGetInstallerListQuery()
  const { data: addons, loading } = useGetAddonListQuery({ showVersions: true })

  const [formData, setFormData] = useState({})
  const [isNew, setIsNew] = useState(true)

  const [createBundle] = useCreateBundleMutation()

  useEffect(() => {
    if (!installerList?.length) return
    if (bundle) {
      setFormData(bundle)
      setIsNew(false)
    } else {
      setFormData({ installerVersion: installerList[0].version })
      setIsNew(true)
    }
  }, [bundle, installerList])

  const installerVersions = useMemo(() => {
    if (!installerList) return []

    const r = {}
    for (const installer of installerList) {
      if (r[installer.version]) {
        r[installer.version].push(installer.platform)
      } else {
        r[installer.version] = [installer.platform]
      }
    }

    return Object.entries(r).map(([version, platforms]) => ({
      label: `${version} (${platforms.join(', ')})`,
      value: version,
    }))
  }, [installerList])

  if (loading) return <div>Loading...</div>
  if (!addons?.length) return <div>No addons found</div>

  const onSave = async () => {
    if (!isNew) {
      toast.error('Updating bundle is not supported yet')
      return
    }

    if (!formData?.name) {
      toast.error('Name is required')
      return
    }

    await createBundle(formData).unwrap()
    toast.success('Bundle created')
    setIsNew(false)
  }

  return (
    <Section>
      <Toolbar>
        <Spacer />
        <Button
          label={isNew ? 'Create new bundle' : 'Update bundle'}
          icon="save"
          onClick={onSave}
        />
      </Toolbar>
      <FormLayout>
        <FormRow label="Name">
          <InputText
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={!isNew}
          />
        </FormRow>
        <FormRow label="Installer version">
          <Dropdown
            value={formData?.installerVersion ? [formData.installerVersion] : []}
            options={installerVersions}
            onChange={(e) => setFormData({ ...formData, installerVersion: e[0] })}
            disabled={!isNew}
            widthExpand
          />
        </FormRow>
      </FormLayout>

      <h2>Addons</h2>

      <AddonVersions formData={formData} setFormData={setFormData} readOnly={!isNew} />

      <ScrollPanel style={{ flexGrow: 1 }} className="transparent"></ScrollPanel>
    </Section>
  )
}

export default BundleDetail
