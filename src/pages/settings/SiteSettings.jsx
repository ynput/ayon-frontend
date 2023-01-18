import { useState, useMemo } from 'react'
import {
  Section,
  Panel,
  Toolbar,
  ScrollPanel,
  Button,
  TablePanel,
} from '@ynput/ayon-react-components'

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

import SettingsEditor from '/src/containers/settingsEditor'
import AddonList from '/src/containers/addonList'
import SitesDropdown from '/src/containers/SitesDropdown'

import { useGetSiteSettingsSchemaQuery, useGetSiteSettingsQuery } from '/src/services/siteSettings'
import { useSetSiteSettingsMutation } from '/src/services/siteSettings'

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

const ChangeList = ({ changes }) => {
  const columns = [
    { field: 'addonName', header: 'Addon' },
    { field: 'addonVersion', header: 'Version' },
    { field: 'siteId', header: 'Site' },
  ]

  const rows = useMemo(() => {
    return Object.keys(changes).map((key) => {
      const [addonName, addonVersion, siteId] = key.split('|')
      return {
        addonName,
        addonVersion,
        siteId,
      }
    })
  }, [changes])

  return (
    <Section style={{ maxWidth: 400 }}>
      <Toolbar>
        <h3>Changes</h3>
      </Toolbar>
      <TablePanel>
        <DataTable value={rows}>
          {columns.map((col) => (
            <Column key={col.field} field={col.field} header={col.header} />
          ))}
        </DataTable>
      </TablePanel>
    </Section>
  )
}

const SiteSettings = () => {
  const [selectedAddons, setSelectedAddons] = useState([])
  const [selectedSite, setSelectedSite] = useState(null)
  const [showVersions, setShowVersions] = useState(false)
  const [newData, setNewData] = useState({})

  const [setSiteSettings] = useSetSiteSettingsMutation()

  const listHeader = useMemo(() => {
    return (
      <Toolbar>
        <Button
          checked={showVersions}
          onClick={() => setShowVersions((v) => !v)}
          label={showVersions ? 'Hide all versions' : 'Show all versions'}
        />
        <SitesDropdown value={selectedSite} onChange={setSelectedSite} style={{ flexGrow: 1 }} />
      </Toolbar>
    )
  }, [selectedSite])

  const saveChanges = () => {
    for (const key in newData) {
      const [addonName, addonVersion, siteId] = key.split('|')
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

  const onChange = (addonName, addonVersion, data) => {
    const key = `${addonName}|${addonVersion}|${selectedSite}`
    setNewData((newData) => {
      newData[key] = data
      return { ...newData }
    })
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
      <ChangeList changes={newData} />
    </main>
  )
}

export default SiteSettings
