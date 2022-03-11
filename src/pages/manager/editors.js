import { InputText } from 'primereact/inputtext'
import { InputNumber } from 'primereact/inputnumber'

const stringEditor = (options) => {
  return <InputText 
    type="text" 
    value={options.value} 
    onChange={(e) => options.editorCallback(e.value)} 
  />
}

const integerEditor = (options, callback, value) => {
  //console.log(options)
  //  onChange={(e) => options.editorCallback(e.value)} 
  return (
    <div className="table-editor"
      style={{
        width: "100%",
        height: "100%",
      }}
    >
    <InputNumber 
      showButtons={false}
      useGrouping={false}
      allowEmpty={true}
      value={value} 
      onChange={(e)=>{callback(options, e.value)}}
      className="p-inputtext-sm"
  />
    </div>
  )
}

const floatEditor = (options) => {
  //console.log(options)
  //  onChange={(e) => options.editorCallback(e.value)} 
  return (
    <div className="table-editor"
      style={{
        width: "100%",
        height: "100%",
      }}
    >
    <InputNumber 
      showButtons={false}
      value={options.value} 
      minFractionDigits={3}
      maxFractionDigits={3}
      onChange={(e)=>{console.log(e)}}
      className="p-inputtext-sm"
  />
    </div>
  )
}


export {stringEditor, integerEditor, floatEditor}
