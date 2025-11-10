import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Section, Spacer, Panel, Toolbar, ScrollPanel, Button } from '@ynput/ayon-react-components'

import SettingsEditor from '@containers/SettingsEditor'
import SettingsAddonList from '@containers/AddonSettings/SettingsAddonList'
import SiteList from '@containers/SiteList'

import { useGetSiteSettingsSchemaQuery, useGetSiteSettingsQuery } from '@queries/siteSettings'
import { useSetSiteSettingsMutation } from '@queries/siteSettings'

const SiteSettingsEditor = ({ addonName, addonVersion, siteId, onChange }) => {
  const [formData, setFormData] = useState(null)

  const { data: schema, isLoading: schemaLoading } = useGetSiteSettingsSchemaQuery({
    addonName,
    addonVersion,
  })

  const { data: originalData, isLoading: settingsLoading } = useGetSiteSettingsQuery({
    addonName,
    addonVersion,
    siteId,
  })

  useEffect(() => {
    if (!originalData) return
    setFormData(originalData)
  }, [originalData])

  useEffect(() => {
    onChange(formData)
  }, [formData])

  if (!(schema && originalData)) return 'Loading editor...'
  if (schemaLoading || settingsLoading) {
    return 'Loading...'
  }

  return (
    <SettingsEditor
      schema={{ ...schema, title: `${schema.title} (${siteId})` }}
      formData={formData}
      onChange={setFormData}
    />
  )
}

const SiteSettings = () => {
  const [selectedAddons, setSelectedAddons] = useState([])
  const [selectedSites, setSelectedSites] = useState([])
  const [newData, setNewData] = useState({})
  const [setSiteSettings] = useSetSiteSettingsMutation()

  const saveChanges = async () => {
    for (const key in newData) {
      // eslint-disable-next-line no-unused-vars
      const [addonName, addonVersion, siteId, projectName] = key.split('|')
      const data = newData[key]

      try {
        await setSiteSettings({
          addonName,
          addonVersion,
          siteId,
          data,
        }).unwrap()
      } catch (error) {
        const e = error.data || error
        toast.error(
          <>
            <strong>Unable to save {addonName} settings</strong>
            <br />
            {!e.errors?.length && e.detail}
            {e.errors?.length && (
              <ul>
                {e.errors.map((error, i) => (
                  <li key={i}>
                    {error.loc.join('/')}: {error.msg}
                  </li>
                ))}
              </ul>
            )}
          </>,
        )
        return
      }

    }
    toast.success('Site settings saved')
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
      <Section style={{ maxWidth: 400 }}>
        <SettingsAddonList
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
