import { useMemo, useState, useEffect } from 'react'
import styled from 'styled-components'
import { toast } from 'react-toastify'
import {
  ScrollPanel,
  Section,
  InputText,
  Toolbar,
  Spacer,
  Dropdown,
  FormLayout,
  FormRow,
  SaveButton,
  Button,
} from '@ynput/ayon-react-components'

import { useGetInstallerListQuery } from '/src/services/installers'
import { useGetAddonListQuery } from '/src/services/addonList'
import { useCreateBundleMutation } from '/src/services/bundles'

import AddonVersions from './AddonVersions'

const Columns = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
`

const NewBundle = ({ initBundle, onSave }) => {
  const { data: installerList = [], isFetching } = useGetInstallerListQuery()
  const { data: addons, isLoading } = useGetAddonListQuery({ showVersions: true })

  const [formData, setFormData] = useState(null)

  const [createBundle, { isLoading: isCreating }] = useCreateBundleMutation()

  //   set initial form data
  useEffect(() => {
    if (initBundle && !isFetching) {
      setFormData(initBundle)
    }
  }, [initBundle, installerList, isFetching])

  //   set initial installer version
  useEffect(() => {
    if (formData && !isFetching && formData?.installerVersion === undefined) {
      setFormData((form) => ({ installerVersion: installerList?.[0]?.version, ...form }))
    }
  }, [formData, installerList, isFetching])

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

  if (!formData) return null
  if (!isLoading && !addons?.length) return <div>No addons found</div>

  const handleClear = () => {
    setFormData({ installerVersion: installerList?.[0]?.version, name: initBundle?.name })
  }

  const handleSave = async () => {
    if (!formData?.name) {
      toast.error('Name is required')
      return
    }

    try {
      await createBundle(formData).unwrap()
      toast.success('Bundle created')
      onSave(formData.name)
    } catch (error) {
      console.log(error)
      toast.error('Error: ' + error?.data?.detail)
    }
  }

  return (
    <Section>
      <Toolbar>
        <Spacer />
        <Button icon={'clear'} label="Clear" onClick={handleClear} />
        <SaveButton
          label="Create new bundle"
          icon={isCreating ? 'sync' : 'check'}
          onClick={handleSave}
          active={!!formData?.name}
          saving={isCreating}
        />
      </Toolbar>
      <ScrollPanel style={{ flexGrow: 1 }} scrollStyle={{ padding: 10 }}>
        <FormLayout>
          <FormRow label="Name">
            <InputText
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={formData?.name ? {} : { outline: '1px solid var(--color-hl-error)' }}
            />
          </FormRow>
          <FormRow label="Installer version">
            <Dropdown
              value={formData?.installerVersion ? [formData.installerVersion] : []}
              options={installerVersions}
              onChange={(e) => setFormData({ ...formData, installerVersion: e[0] })}
              widthExpand
            />
          </FormRow>
        </FormLayout>

        <Columns>
          <section>
            <h2>Addons</h2>
            <AddonVersions formData={formData} setFormData={setFormData} />
          </section>
        </Columns>
      </ScrollPanel>
    </Section>
  )
}

export default NewBundle
