import { useLocalStorage } from '@shared/hooks'

const useColumnResize = (name) => {
  // use local storage hook to save
  const [columnsWidths, setColumnWidths] = useLocalStorage(name + '-columns-widths', {})

  const handleColumnResize = (e) => {
    const field = e.column.props.field
    const width = e.element.offsetWidth

    // set localstorage for column size change
    setColumnWidths((oldWidthState) => ({ ...(oldWidthState || {}), [field]: width }))
  }

  return [columnsWidths, handleColumnResize]
}

export default useColumnResize
