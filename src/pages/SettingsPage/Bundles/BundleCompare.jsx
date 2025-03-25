import { Panel, Section } from '@ynput/ayon-react-components'
import React, { useRef, useState } from 'react'
import BundlesAddonList from './BundlesAddonList'
import useScrollSync from '@hooks/useScrollSync'

const BundleCompare = ({ bundles = [], addons }) => {
  // for each bundle, in addons check if the same addon has a different version in another bundle
  // if so, set a flag on the addon to show it's different
  const diffAddonVersions = []

  const bundlesAddons = bundles.flatMap((bundle) => bundle.addons)

  addons.forEach(({ name }) => {
    // from addons get all the versions of that addon
    const versions = bundlesAddons.map((addon) => addon[name])
    // check to see if all the versions are the same
    const allSame = versions.every((v) => v === versions[0])

    if (!allSame) {
      diffAddonVersions.push(name)
    }
  })

  const [selectedAddons, setSelectedAddons] = useState([])
  const addonListRefs = useRef([])

  const handleRef = (index) => (ref) => {
    addonListRefs.current[index] = ref
  }

  useScrollSync(addonListRefs, [bundles])

  return (
    <Section direction="row" style={{ alignItems: 'flex-start', overflow: 'auto' }}>
      {bundles.map((bundle, index) => (
        <Panel key={bundle.name} style={{ overflow: 'hidden', height: '100%' }}>
          <h2>{bundle.name}</h2>
          <span>Installer: {bundle.installerVersion}</span>
          <BundlesAddonList
            readOnly
            formData={bundle}
            setSelected={setSelectedAddons}
            selected={selectedAddons}
            ref={handleRef(index)}
            diffAddonVersions={diffAddonVersions}
          />
        </Panel>
      ))}
    </Section>
  )
}

export default BundleCompare
