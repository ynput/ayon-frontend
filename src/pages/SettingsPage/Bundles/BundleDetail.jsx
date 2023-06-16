import { useMemo, useState, useEffect } from 'react'
import {
  ScrollPanel,
  Section,
  InputText,
  Dropdown,
  FormLayout,
  FormRow,
} from '@ynput/ayon-react-components'
import { useGetInstallerListQuery } from '/src/services/installers'

const BundleDetail = ({ bundle }) => {
  const { data: installerList = [] } = useGetInstallerListQuery()
  const [formData, setFormData] = useState({})

  const isReadOnly = !!bundle

  useEffect(() => {
    if (bundle) {
      setFormData(bundle)
    }
  }, [bundle])

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

  return (
    <Section>
      <FormLayout>
        <FormRow label="Name">
          <InputText
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            readOnly={isReadOnly}
          />
        </FormRow>
        <FormRow label="Installer version">
          <Dropdown
            value={[formData.installerVersion || '']}
            options={installerVersions}
            onChange={(e) => setFormData({ ...formData, installerVersion: e.target.value[0] })}
            disabled={isReadOnly}
          />
        </FormRow>
      </FormLayout>

      {JSON.stringify(installerVersions)}

      <ScrollPanel style={{ flexGrow: 1 }} className="transparent"></ScrollPanel>
    </Section>
  )
}

export default BundleDetail
