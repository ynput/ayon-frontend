import styled from 'styled-components'

export const Shortcut = styled.span`
  background-color: var(--md-sys-color-surface-container);
  padding: 2px 4px;
  border-radius: var(--border-radius-m);
  font-size: 90%;
  margin-left: auto;
`

const ShortcutWidget = ({ children, align, style, ...props }) => {
  const alignStyle = {
    marginLeft: align === 'right' ? 'auto' : '0',
    marginRight: align === 'left' ? 'auto' : '0',
  }

  return (
    <Shortcut style={{ ...alignStyle, ...style }} {...props}>
      {children}
    </Shortcut>
  )
}

export default ShortcutWidget
