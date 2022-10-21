import axios from 'axios'

import { useState } from 'react'
import { toast } from 'react-toastify'

import { ToggleButton } from 'primereact/togglebutton'

import {
  Button,
  Spacer,
  Section,
  Panel,
  Toolbar,
  ScrollArea,
} from '/src/components'
import { isEmpty } from '/src/utils'

import AddonList from '/src/containers/addonList'
import AddonSettingsPanel from '/src/containers/addonSettingsPanel'

const StudioOverrides = () => {
  const [showVersions, setShowVersions] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
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

  const addonListHeader = (
    <Toolbar>
      <ToggleButton
        checked={showVersions}
        onChange={(e) => setShowVersions(e.value)}
        onLabel="Hide versions"
        offLabel="Show versions"
      />
      <ToggleButton
        checked={showHelp}
        onChange={(e) => setShowHelp(e.value)}
        onLabel="Hide help"
        offLabel="Show help"
      />
      <Button onClick={onSave} disabled={isEmpty(localData)} label="Save" />
    </Toolbar>
  )

  return (
    <main>
      <AddonList
        showVersions={showVersions}
        selectedAddons={selectedAddons}
        setSelectedAddons={setSelectedAddons}
        changedAddons={Object.keys(localData)}
        onDismissChanges={onDismissChanges}
        onRemoveOverrides={onRemoveOverrides}
        header={addonListHeader}
      />

      <Section className={showHelp && "settings-help-visible"}>
        <ScrollArea>
          {selectedAddons
            .filter((addon) => addon.version)
            .reverse()
            .map((addon) => (
              <Panel
                key={`${addon.name}-${addon.version}`}
                style={{ flexGrow: 0 }}
                className="transparent nopad"
                size={1}
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
                  changedKeys={localOverrides[`${addon.name}@${addon.version}`]}
                  reloadTrigger={
                    reloadTrigger[`${addon.name}@${addon.version}`]
                  }
                />
              </Panel>
            ))}

          <Spacer />
        </ScrollArea>
      </Section>
      {/*
      <Section style={{maxWidth: 300}}>
        <Panel>
          <ScrollArea>
            <h3>Form data</h3>
            <pre style={{ width: '100%', flexGrow: 1 }}>
              {JSON.stringify(localData, null, 2)}
            </pre>
            <h3>Changed keys</h3>
            <pre style={{ width: '100%', flexGrow: 1 }}>
              {JSON.stringify(localOverrides, null, 2)}
            </pre>
          </ScrollArea>
        </Panel>
      </Section
      */}
    </main>
  )
}

export default StudioOverrides
