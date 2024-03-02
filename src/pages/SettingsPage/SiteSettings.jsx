import { useState, useMemo } from 'react'
import { Section, Spacer, Panel, Toolbar, ScrollPanel, Button } from '@ynput/ayon-react-components'

import SettingsEditor from '/src/containers/SettingsEditor'
import AddonList from '/src/containers/AddonList'
import SiteList from '/src/containers/SiteList'

import { useGetSiteSettingsSchemaQuery, useGetSiteSettingsQuery } from '/src/services/siteSettings'
import { useSetSiteSettingsMutation } from '/src/services/siteSettings'
import ProjectList from '/src/containers/projectList'

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
  const [selectedProjects, setSelectedProjects] = useState([])
  const [selectedAddons, setSelectedAddons] = useState([])
  const [selectedSites, setSelectedSites] = useState([])
  const [newData, setNewData] = useState({})
  const [setSiteSettings] = useSetSiteSettingsMutation()

  const saveChanges = () => {
    for (const key in newData) {
      // eslint-disable-next-line no-unused-vars
      const [addonName, addonVersion, siteId, projectName] = key.split('|')
      const data = newData[key]

      setSiteSettings({
        addonName,
        addonVersion,
        siteId,
        data,
      })
    }
    setNewData({})
  }

  const onChange = (addonName, addonVersion, siteId, data) => {
    const key = `${addonName}|${addonVersion}|${siteId}|_`
    setNewData((newData) => {
      newData[key] = data
      return { ...newData }
    })
  }

  return (
    <main style={{ flexDirection: 'row', flexGrow: 1 }}>
      <ProjectList
        styleSection={{ maxWidth: 300, minWidth: 300 }}
        autoSelect
        selection={selectedProjects}
        onSelect={setSelectedProjects}
        multiselect
        showNull
      />
      <Section style={{ maxWidth: 400 }}>
        <AddonList
          selectedAddons={selectedAddons}
          setSelectedAddons={setSelectedAddons}
          environment="production"
          siteSettings={true}
        />
        <SiteList
          value={selectedSites}
          onChange={setSelectedSites}
          style={{ maxHeight: 300 }}
          multiselect={true}
        />
      </Section>

      <Section style={{ flexGrow: 1 }}>
        <Toolbar>
          <Spacer />
          <Button label="Save Changes" icon="check" onClick={() => saveChanges()} />
        </Toolbar>

        {(selectedSites.length && (
          <ScrollPanel style={{ flexGrow: 1 }} className="transparent">
            {selectedAddons.map((addon) => {
              return selectedSites.map((siteId) => {
                return (
                  <Panel
                    key={`${addon.name}|${addon.version}|${siteId}`}
                    style={{ flexGrow: 0 }}
                    className="transparent nopad"
                    size={1}
                  >
                    <SiteSettingsEditor
                      addonName={addon.name}
                      addonVersion={addon.version}
                      siteId={siteId}
                      onChange={(data) => onChange(addon.name, addon.version, siteId, data)}
                    />
                  </Panel>
                )
              })
            })}
          </ScrollPanel>
        )) ||
          'Select a site to edit settings'}
      </Section>
    </main>
  )
}

export default SiteSettings
