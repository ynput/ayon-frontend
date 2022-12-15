import { InputText, InputNumber } from '@ynput/ayon-react-components'
import { Dropdown } from 'primereact/dropdown'
import { getFolderTypes, getTaskTypes } from '/src/utils'

import ayonClient from '/src/ayon'


const typeEditor = (options, callback, value, settings) => {
  const rowData = options.node.data
  if (!rowData) return <></>

  const types =
    rowData.__entityType === 'folder' ? getFolderTypes() : getTaskTypes()

  const onChange = (event) => callback(options, event.value)

  const itemTemplate = (option, props) => {
    if (option) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <span
            className={`material-symbols-outlined`}
            style={{ marginRight: '0.6rem' }}
          >
            {option.icon}
          </span>
          <span>{option.label}</span>
        </div>
      )
    }

    return <span>{props.placeholder}</span>
  }

  // showClear={ rowData.__entityType === "folder" }
  return (
    <Dropdown
      options={types}
      optionLabel="label"
      optionValue="name"
      dataKey="name"
      value={value || '_'}
      emptyMessage="Folder"
      itemTemplate={itemTemplate}
      onChange={onChange}
      style={{ width: '100%' }}
    />
  )
}

const stringEditor = (options, callback, value, settings) => {
  return (
    <InputText
      value={value}
      onChange={(e) => {
        callback(options, e.target.value)
      }}
    />
  )
}

const enumEditor = (options, callback, value, settings) => {
  const enumData = settings.enum || []
  const onChange = (event) => callback(options, event.value)

  return (
    <Dropdown
      value={value || ''}
      options={enumData}
      optionLabel="label"
      optionValue="value"
      dataKey="value"
      onChange={onChange}
      style={{  minWidth: 10, width: '100%' }}
    />
  )

}


const integerEditor = (options, callback, value, settings) => {
  const attrSettings = ayonClient.getAttribSettings(options.field)

  let min = null
  if (attrSettings && attrSettings.data.hasOwnProperty('gt'))
    min = attrSettings.data.gt + 1
  else if (attrSettings && attrSettings.data.hasOwnProperty('gte'))
    min = attrSettings.data.gte

  let max = null
  if (attrSettings && attrSettings.data.hasOwnProperty('lt'))
    max = attrSettings.data.lt - 1
  else if (attrSettings && attrSettings.data.hasOwnProperty('lte'))
    max = attrSettings.data.lte

  return (
    <div className="table-editor">
      <InputNumber
        style={{ width: '100%' }}
        value={value}
        min={min}
        max={max}
        step={1}
        onChange={(e) => {
          const val = e.target.value === '' ? null : parseInt(e.target.value)
          callback(options, val)
        }}
      />
    </div>
  )
}

const floatEditor = (options, callback, value, settings) => {
  //  onChange={(e) => options.editorCallback(e.value)}
  const attrSettings = ayonClient.getAttribSettings(options.field)
  let min = null
  if (attrSettings && attrSettings.data.hasOwnProperty('gt'))
    min = attrSettings.data.gt + 0.00001
  else if (attrSettings && attrSettings.data.hasOwnProperty('gte'))
    min = attrSettings.data.gte

  let max = null
  if (attrSettings && attrSettings.data.hasOwnProperty('lt'))
    max = attrSettings.data.lt - 0.00001
  else if (attrSettings && attrSettings.data.hasOwnProperty('lte'))
    max = attrSettings.data.lte
  return (
    <div
      className="table-editor"
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      <InputNumber
        style={{ width: '100%' }}
        value={value}
        min={min}
        max={max}
        step="any"
        onChange={(e) => {
          const val = e.target.value === '' ? null : parseFloat(e.target.value)
          callback(options, val)
        }}
      />
    </div>
  )
}

export { typeEditor, stringEditor, integerEditor, floatEditor, enumEditor }
