import { Dropdown } from '@ynput/ayon-react-components'
import * as Styled from './PreviewVersionDropdown.styled'
import Shortcuts from '/src/containers/Shortcuts'
import { useRef } from 'react'

const PreviewVersionDropdown = ({ versions, selected, onChange, ...props }) => {
  const options = versions.map(({ id, name }) => ({
    value: id,
    label: name,
  }))

  const dropdownRef = useRef(null)

  const openDropdown = () => {
    const options = dropdownRef.current.getOptions()
    if (!options) dropdownRef.current?.open()
    else dropdownRef.current?.close()

    // focus on the dropdown
    const el = dropdownRef.current?.getElement()
    const buttonEl = el?.querySelector('button')
    if (buttonEl) buttonEl.focus()
  }

  return (
    <>
      <Shortcuts
        shortcuts={[
          {
            key: 'x',
            action: openDropdown,
          },
        ]}
      />
      <Dropdown
        options={options}
        value={[selected]}
        onChange={(v) => onChange(v[0])}
        ref={dropdownRef}
        {...props}
        valueTemplate={(value, selected, isOpen) => (
          <div data-tooltip={'Select a version'} data-shortcut={'X'} style={{ height: '100%' }}>
            <Styled.VersionValueTemplate
              value={selected || value}
              // childrenCustom={<ShortcutWidget>X</ShortcutWidget>}
              isOpen={isOpen}
            >
              {options.find((option) => option.value === (selected || value)[0])?.label ||
                'Select a version'}
            </Styled.VersionValueTemplate>
          </div>
        )}
      />
    </>
  )
}

export default PreviewVersionDropdown
