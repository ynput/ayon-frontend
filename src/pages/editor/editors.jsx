import { InputText } from 'primereact/inputtext'
import { InputNumber } from 'primereact/inputnumber'

const stringEditor = (options, callback, value) => {
  return (
    <InputText 
      type="text" 
      value={value} 
      onChange={(e) => {
        console.log("nchg", e.target.value)
        callback(options, e.target.value)
      }} 
    />
  )
}

const integerEditor = (options, callback, value) => {
  //  onChange={(e) => options.editorCallback(e.value)}
  return (
    <div className="table-editor">
      <InputNumber
        showButtons={false}
        useGrouping={false}
        allowEmpty={true}
        value={value}
        onChange={(e) => {
          callback(options, e.value)
        }}
        className="p-inputtext-sm"
      />
    </div>
  )
}

const floatEditor = (options, callback, value) => {
  //console.log(options)
  //  onChange={(e) => options.editorCallback(e.value)}
  return (
    <div
      className="table-editor"
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      <InputNumber
        showButtons={false}
        value={value}
        minFractionDigits={3}
        maxFractionDigits={3}
        onChange={(e) => {
          callback(options, e.value)
        }}
        className="p-inputtext-sm"
      />
    </div>
  )
}

export { stringEditor, integerEditor, floatEditor }
