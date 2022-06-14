import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { DataTable } from 'primereact/datatable'
import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'
import { Panel } from 'primereact/panel'
import { ToggleButton } from 'primereact/togglebutton'

import { Button, Spacer } from '../../components'
import SettingsEditor from '../../containers/settingsEditor'

const AddonsPanel = ({ selectedAddons, onSelectAddons, showVersions }) => {
  const [addons, setAddons] = useState({})

  const selectedKeys = useMemo(() => {
    const result = {}
    for (const addon of selectedAddons) {
      const key = `${addon.name}@${addon.version}`
      result[key] = true
    }
    return result
  }, [selectedAddons])

  console.log('SELECTED KEYS', selectedKeys)

  const onSelectionChange = (e) => {
    let result = []
    for (const rd of addons) {
      if (e.value[rd.key]) {
        console.log('oooo', rd)
        result.push(rd.data)
      }

      for (const rdc of rd.children) {
        if (e.value[rdc.key]) {
          result.push(rdc.data)
        }
      }
    }
    onSelectAddons(result)
  }

  useEffect(() => {
    axios.get('/api/addons').then((res) => {
      let result = []
      for (const addon of res.data.addons) {
        const row = {
          key: showVersions
            ? `${addon.name}@production`
            : `${addon.name}@${addon.productionVersion}`,
          selectable: !showVersions,
          children: [],
          data: {
            name: addon.name,
            title: addon.title,
            version: showVersions ? '' : addon.productionVersion,
          },
        }

        if (showVersions) {
          for (const version of addon.versions) {
            row.children.push({
              key: `${addon.name}@${version}`,
              data: {
                name: addon.name,
                title: addon.title,
                version: version,
                usage:
                  addon.productionVersion === version
                    ? 'Production'
                    : addon.stagingVersion === version
                    ? 'Staging'
                    : '',
              },
            })
          }
        } // if showVersions

        result.push(row)
      }
      console.log(result)
      setAddons(result)
    })
  }, [showVersions])

  return (
    <section style={{ width: 400, height: '100%' }}>
      <div className="wrapper">
        <TreeTable
          value={addons}
          selectionMode="multiple"
          selectionKeys={selectedKeys}
          onSelectionChange={onSelectionChange}
        >
          <Column field="name" header="Name" expander="true" />
          <Column field="version" header="Version" />
          <Column field="usage" header="" />
        </TreeTable>
      </div>
    </section>
  )
}

const SettingsPanel = ({ addon, onClose, onUpdate }) => {
  const [schema, setSchema] = useState(null)
  const [originalData, setOriginalData] = useState(null)
  const [overrides, setOverrides] = useState(null)
  const [newData, setNewData] = useState(null)

  const loadSchema = () => {
    const params = { version: addon.version }
    axios
      .get(`/api/addons/${addon.name}/schema`, { params })
      .then((res) => setSchema(res.data))
      .catch((err) => console.log(err))
  }

  const loadSettings = () => {
    const params = { version: addon.version }
    axios
      .get(`/api/addons/${addon.name}/settings`, { params })
      .then((res) => {
        setOriginalData(res.data)
        setNewData(null)
      })
      .catch((err) => console.log(err))

    axios
      .get(`/api/addons/${addon.name}/overrides`)
      .then((res) => setOverrides(res.data))
  }

  useEffect(() => {
    loadSchema()
    loadSettings()
  }, [addon.name, addon.version])

  const onChange = (formData) => {
    //   console.log(formData)
    setNewData(formData)
  }

  const editor = useMemo(() => {
    if (!(schema && originalData && overrides)) return <></>
    return (
      <SettingsEditor
        schema={schema}
        formData={originalData}
        overrides={overrides}
        onChange={onChange}
        onSetBreadcrumbs={() => {}}
      />
    )
  }, [schema, originalData, overrides])

  return <div style={{ flexGrow: 0 }}>{editor}</div>
}

const SystemSettings = () => {
  const [showVersions, setShowVersions] = useState(false)
  const [selectedAddons, setSelectedAddons] = useState([])

  const [newData, setNewData] = useState({})

  const onSettingsChange = (addon, version, data) => {
    if (!newData[addon]) newData[addon] = {}
    newData[addon][version] = data
    setNewData(newData)
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
        </section>
        <section className="invisible row" style={{ flexGrow: 1 }}>
          <AddonsPanel
            showVersions={showVersions}
            selectedAddons={selectedAddons}
            onSelectAddons={setSelectedAddons}
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
                .map((addon) => (
                  <Panel
                    key={`${addon.name}-${addon.version}`}
                    style={{ flexGrow: 0 }}
                  >
                    <SettingsPanel addon={addon} onUpdate={onSettingsChange} />
                  </Panel>
                ))}

              <Spacer />
            </div>
          </section>
        </section>
      </section>
    </main>
  )
}

export default SystemSettings
