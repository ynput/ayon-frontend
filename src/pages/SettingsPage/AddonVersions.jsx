import { Dropdown } from 'primereact/dropdown'
import { Spacer, Panel, ScrollPanel } from '@ynput/ayon-react-components'

import { useMemo, useRef } from 'react'

import { useGetAddonListQuery } from '/src/services/addonList'
import { useSetAddonVersionMutation } from '/src/services/addonList'

const AddonListItem = ({ addonName, addonTitle, productionVersion, stagingVersion, versions }) => {
  const [setAddonVersion] = useSetAddonVersionMutation()
  const productionRef = useRef(null)
  const stagingRef = useRef(null)

  const options = useMemo(() => {
    return [
      { label: '(NONE)', value: null },
      ...(versions || []).map((version) => {
        return {
          label: version,
          value: version,
        }
      }),
    ]
  }, [versions])

  const onProductionChange = (e) => {
    setAddonVersion({ addonName, productionVersion: e.value })
  }

  const onStagingChange = (e) => {
    setAddonVersion({ addonName, stagingVersion: e.value })
  }

  return (
    <Panel style={{ width: 800, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <div style={{ flexBasis: 300 }}>{addonTitle}</div>
      <Spacer />
      <span>Production</span>
      <Dropdown
        style={{ width: 200 }}
        ref={productionRef}
        options={options}
        value={productionVersion}
        placeholder="(NONE)"
        onChange={onProductionChange}
      />
      <span>Staging</span>
      <Dropdown
        style={{ width: 200 }}
        ref={stagingRef}
        options={options}
        value={stagingVersion}
        placeholder="(NONE)"
        onChange={onStagingChange}
      />
    </Panel>
  )
}

// eslint-disable-next-line no-unused-vars
const AddonVersions = ({ projectName }) => {
  const { data: addons, loading } = useGetAddonListQuery({ showVersions: true })

  if (loading) return <div>Loading...</div>

  return (
    <>
      <ScrollPanel style={{ flexGrow: 1, backgroundColor: 'transparent' }}>
        <Spacer>
          <section
            className="invisible"
            style={{ gap: 8, display: 'flex', flexDirection: 'column' }}
          >
            {addons?.length &&
              addons.map((addon) => (
                <AddonListItem
                  key={addon.key}
                  addonName={addon.name}
                  addonTitle={addon.title}
                  productionVersion={addon.productionVersion}
                  stagingVersion={addon.stagingVersion}
                  versions={Object.keys(addon.versions || {})}
                />
              ))}
          </section>
        </Spacer>
      </ScrollPanel>
    </>
  )
}

export default AddonVersions
