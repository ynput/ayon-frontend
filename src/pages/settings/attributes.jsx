import axios from 'axios'
import { toast } from 'react-toastify'
import { useState, useEffect, useMemo } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { TablePanel, Button, Section, Toolbar } from '@ynput/ayon-react-components'
import AttributeEditor from '../../containers/attributes/attributeEditor'

const Attributes = () => {
  const [loading, setLoading] = useState(false)
  const [attributes, setAttributes] = useState(null)
  const [selectedAttribute, setSelectedAttribute] = useState(null)
  const [showEditor, setShowEditor] = useState(false)

  const loadAttributes = () => {
    setLoading(true)
    axios
      .get('/api/attributes')
      .then((response) => {
        setAttributes(response.data.attributes)
      })
      .catch(() => {
        toast.error('Unable to load attribute list')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadAttributes()
  }, [])

  // used to disallow adding a new attribute with existing name
  // seriously. the syntax is terrible. compare the following:
  // existingAttrNames = [attr.name for attr in attributes] if attributes else []
  const existingAttrNames = useMemo(
    () => (attributes ? attributes.map((i) => i.name) : []),
    [attributes],
  )

  const onSave = () => {
    setLoading(true)
    axios
      .put('/api/attributes', { attributes, deleteMissing: true })
      .then(() => toast.success('Attribute set saved'))
      .catch(() => toast.error('Unable to set attributes'))
      .finally(() => {
        setLoading(false)
        loadAttributes()
      })
  }

  const onEdit = (attribute) => {
    setAttributes((src) => {
      let rows = [...src]
      for (const row of rows) {
        if (row.name === attribute.name) {
          Object.assign(row, attribute)
          return rows
        }
      }
      // new attribute
      rows.push(attribute)
      return rows
    }) // setAttributes
    setSelectedAttribute(attribute)
    setShowEditor(false)
  }

  const onRowReorder = (e) => {
    const rows = e.value
    let i = 0
    for (const row of rows) {
      row.position = i
      i++
    }
    setAttributes(rows)
  }

  const onNewAttribute = () => {
    setSelectedAttribute(null)
    setShowEditor(true)
  }

  const onDelete = () => {
    if (!selectedAttribute?.name || Array.isArray(selectedAttribute)) return
    setAttributes((attrs) => {
      return attrs.filter((attr) => attr.name !== selectedAttribute.name)
    })
  }

  // for sortable fields
  const sortableAttributes = attributes.map((a) => ({ ...a, scopeLength: a.scope.length }))

  return (
    <main>
      {showEditor && (
        <AttributeEditor
          attribute={selectedAttribute}
          existingNames={existingAttrNames}
          onEdit={onEdit}
          onHide={() => setShowEditor(false)}
        />
      )}
      <Section>
        <Toolbar>
          <Button label="Save settings" icon="check" onClick={onSave} />
          <Button label="Add attribute" icon="add" onClick={onNewAttribute} />
          <Button
            label="Delete attribute"
            icon="delete"
            disabled={selectedAttribute?.builtin}
            onClick={onDelete}
          />
        </Toolbar>
        <TablePanel loading={loading}>
          <DataTable
            scrollable="true"
            scrollHeight="flex"
            dataKey="name"
            value={sortableAttributes}
            reorderableRows
            onRowReorder={onRowReorder}
            selectionMode="single"
            selection={selectedAttribute}
            onSelectionChange={(e) => setSelectedAttribute(e.value)}
            onRowDoubleClick={() => !Array.isArray(selectedAttribute) && setShowEditor(true)}
            resizableColumns
          >
            <Column rowReorder style={{ maxWidth: 30 }} />
            <Column field="name" header="Name" style={{ maxWidth: 130 }} sortable />
            <Column field="data.title" header="Title" style={{ maxWidth: 130 }} sortable />
            <Column
              field="builtin"
              header=""
              style={{ maxWidth: 60 }}
              body={(rowData) => (rowData?.builtin ? 'built-in' : '')}
              sortable
            />
            <Column
              header="Scopes"
              field="scopeLength"
              body={(rowData) => rowData.scope.join(', ')}
              style={{ maxWidth: 330 }}
              sortable
            />
            <Column field="data.type" header="Type" style={{ maxWidth: 150 }} sortable />
            <Column field="data.example" header="Example" style={{ maxWidth: 200 }} sortable />
            <Column field="data.description" header="Description" sortable />
          </DataTable>
        </TablePanel>
      </Section>
    </main>
  )
}

export default Attributes
