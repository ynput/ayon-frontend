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
    console.log('stagingRef', stagingRef.current)
    setAddonVersion({
      addonName,
      productionVersion: e.value,
      stagingVersion: stagingRef.current.props.value,
    })
  }

  const onStagingChange = (e) => {
    setAddonVersion({
      addonName,
      productionVersion: productionRef.current.props.value,
      stagingVersion: e.value,
    })
  }

  return (
    <Panel style={{ width: 800, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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
  const { data, loading } = useGetAddonListQuery({ showVersions: true })

  // TODO: use original data to show changes
  // TODO: project specific overrides
  //
  if (loading || !data?.length) return <div>Loading...</div>

  return (
    <>
      <ScrollPanel style={{ flexGrow: 1, backgroundColor: 'transparent' }}>
        <Spacer>
          <section
            className="invisible"
            style={{ gap: 6, display: 'flex', flexDirection: 'column' }}
          >
            {data.map((addon) => (
              <AddonListItem
                key={addon.key}
                addonName={addon.data?.name}
                addonTitle={addon.data?.title}
                productionVersion={addon.data?.productionVersion}
                stagingVersion={addon.data?.stagingVersion}
                versions={addon.children.map((version) => version.data.version)}
              />
            ))}
          </section>
        </Spacer>
      </ScrollPanel>
    </>
  )
}

export default AddonVersions
