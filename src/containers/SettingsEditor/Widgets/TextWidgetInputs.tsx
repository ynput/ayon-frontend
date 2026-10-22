import { Button } from '@ynput/ayon-react-components'
import { CodeEditor } from '@shared/components/CodeEditor'
import { CodeEditorWrapper } from '../SettingsEditor.styled'
import { $Any } from '@types'

export const SettingsCodeEditor = (props: $Any) => (
  <CodeEditorWrapper className="settings-code-editor">
    <CodeEditor {...props} />
  </CodeEditorWrapper>
)

export const PermissionWidget = ({
  value,
  setValue,
}: {
  value: number
  setValue: (value: number) => void
}) => (
  <div style={{ display: 'flex', flexDirection: 'row', gap: 6 }}>
    <Button label="No access" onClick={() => setValue(0)} variant={!value ? 'danger' : 'surface'} />
    <Button
      label="Read only"
      onClick={() => setValue(1)}
      variant={value === 1 ? 'filled' : 'surface'}
    />
    <Button
      label="Read & Write"
      onClick={() => setValue(2)}
      variant={value === 2 ? 'tertiary' : 'surface'}
    />
  </div>
)
