import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'
import { Panel } from 'primereact/panel'
import { ToggleButton } from 'primereact/togglebutton'

import { Button, Spacer } from '../../components'
import SettingsEditor from '../../containers/settingsEditor'

const AddonsPanel = ({
  selectedAddons,
  setSelectedAddons,
  showVersions,
  changedKeys,
}) => {
  const [addons, setAddons] = useState({})

  // Selection
  // selectedAddons state from the parent component stores "data" of the selected addons
  // but for the datatable, we only need keys. the following selectedKeys and onSelectionChange
  // functions are used to convert the data to keys and vice versa.

  const selectedKeys = useMemo(() => {
    const result = {}
    for (const addon of selectedAddons) {
      const key = `${addon.name}@${addon.version}`
      result[key] = true
    }
    return result
  }, [selectedAddons])

  const onSelectionChange = (e) => {
    // This nested loop looks a bit weird, but it's necessary
    // to maintain the order of the selected addons as
    // the user selects them.
    let result = []
    for (const key in e.value) {
      for (const rd of addons) {
        if (rd.key === key) {
          result.push(rd.data)
        }
        for (const rd2 of rd.children) {
          if (rd2.key === key) {
            result.push(rd2.data)
          }
        }
      }
    }
    setSelectedAddons(result)
  }

  // Load addons from the server

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
          for (const version in addon.versions) {
            if (!addon.versions[version].hasSettings) continue
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
      setAddons(result)
    })
  }, [showVersions])

  // Add this to the treetable to make multiselect work without
  // ctrl+click:
  // metaKeySelection={false}

  return (
    <section style={{ width: 400, height: '100%' }}>
      <div className="wrapper">
        <TreeTable
          value={addons}
          selectionMode="multiple"
          selectionKeys={selectedKeys}
          onSelectionChange={onSelectionChange}
          rowClassName={(rowData) => {
            return changedKeys.includes(rowData.key) ? 'changed' : ''
          }}
        >
          <Column field="title" header="Addon" expander="true" />
          <Column field="version" header="Version" />
          <Column field="usage" header="" />
        </TreeTable>
      </div>
    </section>
  )
}

const SettingsPanel = ({ addon, onUpdate, localData, reloadTrigger }) => {
  const [schema, setSchema] = useState(null)
  const [originalData, setOriginalData] = useState(null)
  const [overrides, setOverrides] = useState(null)

  const loadSchema = () => {
    axios
      .get(`/api/addons/${addon.name}/${addon.version}/schema`)
      .then((res) => setSchema(res.data))
      .catch((err) => console.log(err))
  }

  const loadSettings = () => {
    if (localData) {
      setOriginalData(localData)
    } else {
      axios
        .get(`/api/addons/${addon.name}/${addon.version}/settings`)
        .then((res) => {
          setOriginalData(res.data)
          //setNewData(null)
        })
        .catch((err) => console.log(err))
    }

    axios
      .get(`/api/addons/${addon.name}/${addon.version}/overrides`)
      .then((res) => setOverrides(res.data))
  }

  useEffect(() => {
    loadSchema()
    loadSettings()
  }, [addon.name, addon.version, reloadTrigger])

  const onChange = (formData) => {
    onUpdate(addon.name, addon.version, formData)
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
  const [reloadTrigger, setReloadTrigger] = useState(0)

  const [newData, setNewData] = useState({})

  const onSettingsChange = (addon, version, data) => {
    const res = { ...newData }
    if (!res[addon]) res[addon] = {}
    res[addon][version] = data
    setNewData(res)
  }

  const changedKeys = useMemo(() => {
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
          .then((res) => {
            setReloadTrigger(reloadTrigger + 1)
          })
          .catch((err) => console.log(err))
      }
    }
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
            disabled={changedKeys.length === 0}
            label="Save"
          />
        </section>
        <section className="invisible row" style={{ flexGrow: 1 }}>
          <AddonsPanel
            showVersions={showVersions}
            selectedAddons={selectedAddons}
            setSelectedAddons={setSelectedAddons}
            changedKeys={changedKeys}
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
                      localData={
                        newData[addon.name] &&
                        newData[addon.name][addon.version]
                      }
                      reloadTrigger={reloadTrigger}
                    />
                  </Panel>
                ))}

              <Spacer />
            </div>
          </section>
          <section style={{ width: 600, height: '100%' }}>
            <div className="wrapper" style={{ overflowY: 'scroll' }}>
              <pre style={{ width: '100%', height: '100%' }}>
                {JSON.stringify(newData, null, 2)}
              </pre>
            </div>
          </section>
        </section>
      </section>
    </main>
  )
}

export default SystemSettings
