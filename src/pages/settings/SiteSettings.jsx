import SettingsEditor from '/src/containers/settingsEditor'
import AddonList from '/src/containers/addonList'

import { Section, Panel, Toolbar, ScrollPanel } from '@ynput/ayon-react-components'
import { useState, useMemo, useEffect } from 'react'
import SitesDropdown from '/src/containers/SitesDropdown'

import { useGetSiteSettingsSchemaQuery, useGetSiteSettingsQuery } from '/src/services/siteSettings'
//, useSetSiteSettingsMutation

const SiteSettingsEditor = ({ addonName, addonVersion, siteId }) => {
  const { data: schema, isLoading: schemaLoading } = useGetSiteSettingsSchemaQuery({
    addonName,
    addonVersion,
  })
  const { data: originalData, isLoading: settingsLoading } = useGetSiteSettingsQuery({
    addonName,
    addonVersion,
    siteId,
  })

  const [newData, setNewData] = useState(null)

  useEffect(() => {
    setNewData(originalData)
  }, [originalData])

  const editor = useMemo(() => {
    if (!(schema && originalData)) return 'Loading editor...'

    return (
      <SettingsEditor
        schema={{ ...schema, title: `${schema.title} (${siteId})` }}
        formData={originalData}
        onChange={setNewData}
      />
    )
  }, [schema, originalData, siteId])

  if (schemaLoading || settingsLoading) {
    return 'Loading...'
  }

  console.log(newData)

  return editor
}

const SiteSettings = () => {
  const [selectedAddons, setSelectedAddons] = useState([])
  const [selectedSite, setSelectedSite] = useState(null)

  const listHeader = useMemo(() => {
    return (
      <Toolbar>
        <SitesDropdown value={selectedSite} onChange={setSelectedSite} />
      </Toolbar>
    )
  }, [selectedSite])

  return (
    <main style={{ flexDirection: 'row', flexGrow: 1 }}>
      <AddonList
        projectKey="default"
        showVersions={true}
        selectedAddons={selectedAddons}
        setSelectedAddons={setSelectedAddons}
        changedAddons={[]}
        onDismissChanges={() => {}}
        onRemoveOverrides={() => {}}
        header={listHeader}
      />

      <Section style={{ flexGrow: 1 }}>
        <Toolbar>toolbar pyco</Toolbar>

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
                />
              </Panel>
            )
          })}
        </ScrollPanel>
      </Section>
    </main>
  )
}

export default SiteSettings
