import { Dropdown } from '@ynput/ayon-react-components'
import * as Styled from './PreviewVersionDropdown.styled'
import ShortcutWidget from '../../ShortcutWidget/ShortcutWidget'

const PreviewVersionDropdown = ({ versions, selected, onChange, selectRef, ...props }) => {
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
        <div data-tooltip={'Select a version'} data-shortcut={'S'} style={{ height: '100%' }}>
          <Styled.VersionValueTemplate
            value={selected || value}
            childrenCustom={<ShortcutWidget>S</ShortcutWidget>}
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

export default PreviewVersionDropdown
