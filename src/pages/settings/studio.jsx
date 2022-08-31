import axios from 'axios'

import { useState } from 'react'
import { toast } from 'react-toastify'

import { Panel } from 'primereact/panel'
import { ToggleButton } from 'primereact/togglebutton'

import { Button, Spacer } from '/src/components'
import { isEmpty } from '/src/utils'

import AddonList from '/src/containers/addonList'
import AddonSettingsPanel from '/src/containers/addonSettingsPanel'

const StudioOverrides = () => {
  const [showVersions, setShowVersions] = useState(false)
  const [selectedAddons, setSelectedAddons] = useState([])
  const [reloadTrigger, setReloadTrigger] = useState({})
  const [localData, setLocalData] = useState({})
  const [localOverrides, setLocalOverrides] = useState({})

  const onSettingsChange = (addonName, addonVersion, data) => {
    setLocalData((localData) => {
      localData[`${addonName}@${addonVersion}`] = data
      return { ...localData }
    })
  }

  const onSetChangedKeys = (addonName, addonVersion, data) => {
    setLocalOverrides((localOverrides) => {
      localOverrides[`${addonName}@${addonVersion}`] = data
      return { ...localOverrides }
    })
  }

  const forceAddonReload = (addonName, addonVersion) => {
    setReloadTrigger((reloadTrigger) => {
      const now = new Date()
      return {
        ...reloadTrigger,
        [`${addonName}@${addonVersion}`]: now,
      }
    })
  }

  const onSave = () => {
    for (const key in localData) {
      const [addonName, addonVersion] = key.split('@')
      axios
        .post(
          `/api/addons/${addonName}/${addonVersion}/settings`,
          localData[key]
        )
        .then(() => {
          setLocalOverrides({})
          setLocalData({})
        })
        .catch((err) => {
          toast.error(`Unable to save ${addonName} ${addonVersion} settings`)
          console.log(err)
        })
        .finally(() => {
          forceAddonReload(addonName, addonVersion)
        })
    }
  }

  const onDismissChanges = (addonName, addonVersion) => {
    const key = `${addonName}@${addonVersion}`

    setLocalData((localData) => {
      const res = { ...localData }
      if (res[key]) delete res[key]
      return res
    })

    setLocalOverrides((overrides) => {
      const res = { ...overrides }
      if (res[key]) delete res[key]
      return res
    })

    forceAddonReload(addonName, addonVersion)
  } // end of onDismissChanges

  const onRemoveOverrides = (addonName, addonVersion) => {
    axios
      .delete(`/api/addons/${addonName}/${addonVersion}/overrides`)
      .then(() => {
        onDismissChanges(addonName, addonVersion)
      })
  }

  return (
    <main>
      <section className="invisible" style={{ flexGrow: 1 }}>
        <section className="invisible row">
          <ToggleButton
            checked={showVersions}
            onChange={(e) => setShowVersions(e.value)}
            onLabel="Hide versions"
            offLabel="Show versions"
          />
          <Button onClick={onSave} disabled={isEmpty(localData)} label="Save" />
        </section>
        <section className="invisible row" style={{ flexGrow: 1 }}>
          <AddonList
            showVersions={showVersions}
            selectedAddons={selectedAddons}
            setSelectedAddons={setSelectedAddons}
            changedAddons={Object.keys(localData)}
            onDismissChanges={onDismissChanges}
            onRemoveOverrides={onRemoveOverrides}
          />
          <section
            className="invisible"
            style={{ flexGrow: 2, height: '100%' }}
          >
            <div
              className="wrapper"
              style={{
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'scroll',
                gap: 12,
              }}
            >
              {selectedAddons
                .filter((addon) => addon.version)
                .reverse()
                .map((addon) => (
                  <Panel
                    key={`${addon.name}-${addon.version}`}
                    style={{ flexGrow: 0 }}
                  >
                    <AddonSettingsPanel
                      addon={addon}
                      onChange={(data) =>
                        onSettingsChange(addon.name, addon.version, data)
                      }
                      onSetChangedKeys={(data) =>
                        onSetChangedKeys(addon.name, addon.version, data)
                      }
                      localData={localData[`${addon.name}@${addon.version}`]}
                      changedKeys={
                        localOverrides[`${addon.name}@${addon.version}`]
                      }
                      reloadTrigger={
                        reloadTrigger[`${addon.name}@${addon.version}`]
                      }
                    />
                  </Panel>
                ))}

              <Spacer />
            </div>
          </section>
          <section style={{ minWidth: 300, flexGrow: 1, height: '100%' }}>
            <div
              className="wrapper"
              style={{ overflowY: 'scroll', flexDirection: 'column' }}
            >
              <h3>Form data</h3>
              <pre style={{ width: '100%', flexGrow: 1 }}>
                {JSON.stringify(localData, null, 2)}
              </pre>
              <h3>Changed keys</h3>
              <pre style={{ width: '100%', flexGrow: 1 }}>
                {JSON.stringify(localOverrides, null, 2)}
              </pre>
            </div>
          </section>
        </section>
      </section>
    </main>
  )
}

export default StudioOverrides
