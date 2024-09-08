import { Dropdown } from '@ynput/ayon-react-components'
import { $Any } from '@types'
import { union } from 'lodash'

type Props = {
  attrib: $Any
  value: $Any
  multipleValues: $Any
  isOwn: boolean
  isMultiSelect: boolean
  isChanged: $Any
  onChange: $Any
  onClear?: Function
  onClearNull?: Function
}

const EnumRow = ({
  attrib,
  value,
  multipleValues,
  isOwn,
  isMultiSelect,
  isChanged,
  onChange,
}: Props) => {
  // dropdown
  attrib.title == 'test' && console.log('value: ', value)
  attrib.title == 'test' && console.log('multiple vaules: ', multipleValues)

  let enumValue = isMultiSelect ? value : [value]
  if (multipleValues) {
    enumValue = isMultiSelect ? union(...multipleValues) : multipleValues
  }

  // never show value when inherited, just show placeholder
  if (!isOwn) {
    console.log('null??')
    enumValue = null
  }

  return (
    <Dropdown
      style={{ flexGrow: 1 }}
      value={enumValue}
      isChanged={isChanged}
      options={attrib?.enum}
      onChange={onChange}
      multiSelect={isMultiSelect}
      widthExpand
      emptyMessage={`Select option${isMultiSelect ? 's' : ''}...`}
      nullPlaceholder="(inherited)"
      search={attrib?.enum?.length > 10}
      // multipleValues={!!multipleValues}
      // onClear={onClear}
      // onClearNull={onClearNull}
    />
  )
}
export default EnumRow
