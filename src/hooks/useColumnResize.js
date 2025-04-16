import { useLocalStorage } from '@shared/hooks'

const useColumnResize = (name) => {
  // use local storage hook to save
  const [columnsWidths, setColumnWidths] = useLocalStorage(name + '-columns-widths', {})

  const handleColumnResize = (e) => {
    const key = name + '-columns-widths'
    const field = e.column.props.field
    const width = e.element.offsetWidth

    // set localstorage for column size change
    let oldWidthState = {}
    if (localStorage.getItem(key)) {
      oldWidthState = JSON.parse(localStorage.getItem(key))
    }

    const newWidthState = { ...oldWidthState, [field]: width }
    console.log('updating column widths for: ' + name + ' - ' + field)

    setColumnWidths(newWidthState)
  }

  return [columnsWidths, handleColumnResize]
}

export default useColumnResize
