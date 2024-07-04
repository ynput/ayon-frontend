import { Dropdown, ShortcutTag } from '@ynput/ayon-react-components'
import * as Styled from './ReviewVersionDropdown.styled'

const ReviewVersionDropdown = ({ versions, selected, onChange, selectRef, ...props }) => {
  const options = versions.map(({ id, name }) => ({
    value: id,
    label: name,
  }))

  return (
    <Dropdown
      options={options}
      value={[selected]}
      onChange={(v) => onChange(v[0])}
      ref={selectRef}
      {...props}
      valueTemplate={(value, selected, isOpen) => (
        <div data-tooltip={'Select a version'} data-shortcut={'X'} style={{ height: '100%' }}>
          <Styled.VersionValueTemplate
            value={selected || value}
            childrenCustom={<ShortcutTag>X</ShortcutTag>}
            isOpen={isOpen}
          >
            {options.find((option) => option.value === (selected || value)[0])?.label ||
              'Select a version'}
          </Styled.VersionValueTemplate>
        </div>
      )}
    />
  )
}

export default ReviewVersionDropdown
