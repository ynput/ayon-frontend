import axios from 'axios'

import { useState, useMemo } from 'react'

import { Panel } from 'primereact/panel'
import { ToggleButton } from 'primereact/togglebutton'
import { Button, Spacer } from '/src/components'

import AddonList from './addonList'
import SettingsPanel from './settingsPanel'



const StudioOverrides = () => {
  const [showVersions, setShowVersions] = useState(false)
  const [selectedAddons, setSelectedAddons] = useState([])
  const [reloadTrigger, setReloadTrigger] = useState(0)

  const [newData, setNewData] = useState({})
  const [localOverrides, setLocalOverrides] = useState([])

  const onSettingsChange = (addon, version, data) => {
    const res = { ...newData }
    if (!res[addon]) res[addon] = {}
    res[addon][version] = data
    setNewData(res)
  }

  const onSetChangedKeys = (addon, version, data) => {
    const res = { ...localOverrides } 
    if (!res[addon]) res[addon] = {}
    res[addon][version] = data
    setLocalOverrides(res)
  }

  const changedAddons = useMemo(() => {
    let result = []
    for (const addon in newData) {
      for (const version in newData[addon]) {
        result.push(`${addon}@${version}`)
      }
    }
    return result
  }, [newData])

  const onSave = () => {
    for (const addon in newData) {
      for (const version in newData[addon]) {
        axios
          .post(
            `/api/addons/${addon}/${version}/settings`,
            newData[addon][version]
          )
          .then(() => {
            setLocalOverrides({})
            setNewData({})
            setReloadTrigger(reloadTrigger + 1)
          })
          .catch((err) => console.log(err))
      }
    }
  }

  const onDismissChanges = (addonName, addonVersion) => {
    const res = {...newData}
    delete(res[addonName][addonVersion])
    if (!Object.keys(res[addonName]).length)
      delete(res[addonName])
    setNewData(res)

    const overrides = {...localOverrides}
    delete(overrides[addonName][addonVersion])
    if (!Object.keys(overrides[addonName]).length)
      delete(overrides[addonName])
    setLocalOverrides(overrides)
    setReloadTrigger(reloadTrigger + 1)
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
          <Button
            onClick={onSave}
            disabled={changedAddons.length === 0}
            label="Save"
          />
        </section>
        <section className="invisible row" style={{ flexGrow: 1 }}>
          <AddonList
            showVersions={showVersions}
            selectedAddons={selectedAddons}
            setSelectedAddons={setSelectedAddons}
            changedAddons={changedAddons}
            onDismissChanges={onDismissChanges}
          />
          <section
            className="invisible"
            style={{ flexGrow: 1, height: '100%' }}
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
                    <SettingsPanel
                      addon={addon}
                      onUpdate={onSettingsChange}
                      onSetChangedKeys={onSetChangedKeys}
                      localData={
                        newData[addon.name] &&
                        newData[addon.name][addon.version]
                      }
                      changedKeys={localOverrides[addon.name] && localOverrides[addon.name][addon.version]}
                      reloadTrigger={reloadTrigger}
                    />
                  </Panel>
                ))}

              <Spacer />
            </div>
          </section>
          <section style={{ width: 600, height: '100%' }}>
            <div className="wrapper" style={{ overflowY: 'scroll', flexDirection: 'column' }}>
              <h3>Form data</h3>
              <pre style={{ width: '100%', flexGrow:1 }}>
                {JSON.stringify(newData, null, 2)}
              </pre>
              <h3>Changed keys</h3>
              <pre style={{ width: '100%', flexGrow:1 }}>
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
