import axios from 'axios'
import { toast } from 'react-toastify'
import { useState, useEffect, useMemo } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Dialog } from 'primereact/dialog'
import { MultiSelect } from 'primereact/multiselect'
import { Dropdown } from 'primereact/dropdown'

import {
  TableWrapper,
  Button,
  Spacer,
  FormLayout,
  FormRow,
  InputText,
} from '/src/components'

const SCOPE_OPTIONS = [
  { value: 'project', label: 'Project' },
  { value: 'folder', label: 'Folder' },
  { value: 'task', label: 'Task' },
  { value: 'subset', label: 'Subset' },
  { value: 'version', label: 'Version' },
  { value: 'representation', label: 'Representation' },
  { value: 'user', label: 'User' },
]

const TYPE_OPTIONS = [
  { value: 'string', label: 'String' },
  { value: 'integer', label: 'Integer' },
  { value: 'float', label: 'Decimal number' },
]

const AttributeEditor = ({ attribute, existingNames, onHide, onEdit }) => {
  const [formData, setFormData] = useState(null)

  useEffect(
    () =>
      setFormData(
        attribute || {
          name: 'newAttribute',
          builtin: false,
          scope: ['folder', 'task'],
          position: existingNames.length,
          data: { title: 'New attribute', type: 'string' },
        }
      ),
    [attribute]
  )

  const isNew = !attribute

  const setTopLevelData = (key, value) => {
    setFormData((d) => {
      return { ...d, [key]: value }
    })
  }

  const setData = (key, value) => {
    setFormData((d) => {
      const dt = { ...d.data, [key]: value }
      return { ...d, data: dt }
    })
  }

  let error = null
  if (formData) {
    if (isNew) {
      if (existingNames.includes(formData.name))
        error = 'This attribute already exists'
      else if (!formData.name.match('^[a-zA-Z_]{2,20}$'))
        error = 'Invalid attribute name'
    } // name validation
  }

  const footer = (
    <div style={{ display: 'flex', width: '100%', flexDirection: 'row' }}>
      <Spacer />
      <Button
        label={isNew ? 'Create attribute' : 'Update attribute'}
        icon="check"
        disabled={!!error}
        onClick={() => onEdit(formData)}
      />
    </div>
  )

  return (
    <Dialog
      header={formData?.data?.title || formData?.name}
      footer={footer}
      onHide={onHide}
      visible={true}
      style={{ minWidth: 400 }}
    >
      {formData && (
        <FormLayout>
          <FormRow label="Name">
            <InputText
              value={formData.name}
              disabled={!isNew}
              onChange={(e) => setTopLevelData('name', e.target.value)}
            />
          </FormRow>
          <FormRow label="Scope">
            <MultiSelect
              options={SCOPE_OPTIONS}
              disabled={formData.builtin}
              value={formData.scope}
              onChange={(e) => setTopLevelData('scope', e.target.value)}
            />
          </FormRow>
          <FormRow label="Type">
            <Dropdown 
              value={formData?.data.type} 
              disabled={formData.builtin}
              options={TYPE_OPTIONS} 
              onChange={e => setData('type', e.target.value)}
             />
          </FormRow>
          <FormRow label="Title">
            <InputText
              value={formData.data.title || ''}
              onChange={(e) => setData('title', e.target.value)}
            />
          </FormRow>
          <FormRow label="Example">
            <InputText
              value={formData.data.example || ''}
              onChange={(e) => setData('example', e.target.value)}
            />
          </FormRow>
          <FormRow>
            {error && <span className="form-error-text">{error}</span>}
          </FormRow>
        </FormLayout>
      )}
    </Dialog>
  )
}

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
    [attributes]
  )

  const onSave = () => {
    setLoading(true)
    axios
      .put('/api/attributes', {attributes})
      .then(() => toast.success("Attribute set saved"))
      .catch(() => toast.error("Unable to set attributes"))
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
    if (!selectedAttribute?.name)
      return
    setAttributes(attrs => {
      return attrs.filter(attr => attr.name !== selectedAttribute.name)
    })
  }

  const renderBuiltIn = (rowData) => {
    return rowData?.builtin ? "built-in" : ""
  }

  return (
    <main className="rows">
      {showEditor && (
        <AttributeEditor
          attribute={selectedAttribute}
          existingNames={existingAttrNames}
          onEdit={onEdit}
          onHide={() => setShowEditor(false)}
        />
      )}
      <section className="invisible row">
        <Button label="Save settings" icon="check" onClick={onSave} />
        <Button label="Add attribute" icon="add" onClick={onNewAttribute} />
        <Button label="Delete attribute" icon="delete" disabled={selectedAttribute?.builtin} onClick={onDelete} />
      </section>
      <section style={{ flexGrow: 1 }}>
        <TableWrapper>
          <DataTable
            scrollable="true"
            scrollHeight="flex"
            dataKey="name"
            value={attributes}
            reorderableRows
            onRowReorder={onRowReorder}
            loading={loading}
            selectionMode="single"
            selection={selectedAttribute}
            onSelectionChange={(e) => setSelectedAttribute(e.value)}
            onRowDoubleClick={() => setShowEditor(true)}
          >
            <Column rowReorder style={{ maxWidth: 30 }} />
            <Column field="name" header="Name" style={{ maxWidth: 130 }} />
            <Column
              field="data.title"
              header="Title"
              style={{ maxWidth: 130 }}
            />
            <Column field="builtIn" header="" style={{ maxWidth: 60}} body={ renderBuiltIn }/>
            <Column
              header="Scopes"
              body={(rowData) => rowData.scope.join(', ')}
              style={{ maxWidth: 330 }}
            />
            <Column field="data.type" header="Type" style={{ maxWidth: 150 }} />
            <Column
              field="data.example"
              header="Example"
              style={{ maxWidth: 200 }}
            />
            <Column field="data.description" header="Description" />
          </DataTable>
        </TableWrapper>
      </section>
    </main>
  )
}

export default Attributes
