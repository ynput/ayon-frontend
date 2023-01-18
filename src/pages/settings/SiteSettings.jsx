import SettingsEditor from '/src/containers/settingsEditor'
import AddonList from '/src/containers/addonList'

import { Section, Panel, Toolbar, ScrollPanel, Button } from '@ynput/ayon-react-components'
import { useState, useMemo } from 'react'
import SitesDropdown from '/src/containers/SitesDropdown'

import { useGetSiteSettingsSchemaQuery, useGetSiteSettingsQuery } from '/src/services/siteSettings'
//, useSetSiteSettingsMutation

const SiteSettingsEditor = ({ addonName, addonVersion, siteId, onChange }) => {
  const { data: schema, isLoading: schemaLoading } = useGetSiteSettingsSchemaQuery({
    addonName,
    addonVersion,
  })

  const { data: originalData, isLoading: settingsLoading } = useGetSiteSettingsQuery({
    addonName,
    addonVersion,
    siteId,
  })

  const editor = useMemo(() => {
    if (!(schema && originalData)) return 'Loading editor...'

    return (
      <SettingsEditor
        schema={{ ...schema, title: `${schema.title} (${siteId})` }}
        formData={originalData}
        onChange={onChange}
      />
    )
  }, [schema, originalData, siteId])

  if (schemaLoading || settingsLoading) {
    return 'Loading...'
  }
  return editor
}

const SiteSettings = () => {
  const [selectedAddons, setSelectedAddons] = useState([])
  const [selectedSite, setSelectedSite] = useState(null)
  const [showVersions, setShowVersions] = useState(false)
  //const [newData, setNewData] = useState({})

  const listHeader = useMemo(() => {
    return (
      <Toolbar>
        <Button
          checked={showVersions}
          onClick={() => setShowVersions((v) => !v)}
          label={showVersions ? 'Hide all versions' : 'Show all versions'}
        />
        <SitesDropdown value={selectedSite} onChange={setSelectedSite} />
      </Toolbar>
    )
  }, [selectedSite])

  const saveChanges = () => {}

  const onChange = (addonName, addonVersion, data) => {
    console.log(addonName, addonVersion, data)
  }

  return (
    <main style={{ flexDirection: 'row', flexGrow: 1 }}>
      <AddonList
        projectKey="default"
        showVersions={showVersions}
        selectedAddons={selectedAddons}
        setSelectedAddons={setSelectedAddons}
        changedAddons={[]}
        onDismissChanges={() => {}}
        onRemoveOverrides={() => {}}
        header={listHeader}
        withSettings="site"
      />

      <Section style={{ flexGrow: 1 }}>
        <Toolbar>
          <Button label="Save" icon="check" onClick={() => saveChanges()} />
        </Toolbar>

        {(selectedSite && (
          <ScrollPanel style={{ flexGrow: 1 }} scrollStyle={{ padding: 0 }} className="transparent">
            {selectedAddons.map((addon) => {
              return (
                <Panel
                  key={addon.name}
                  style={{ flexGrow: 0 }}
                  className="transparent nopad"
                  size={1}
                >
                  <SiteSettingsEditor
                    addonName={addon.name}
                    addonVersion={addon.version}
                    siteId={selectedSite}
                    onChange={(data) => onChange(addon.name, addon.version, data)}
                  />
                </Panel>
              )
            })}
          </ScrollPanel>
        )) ||
          'Select a site to edit settings'}
      </Section>
    </main>
  )
}

export default SiteSettings
