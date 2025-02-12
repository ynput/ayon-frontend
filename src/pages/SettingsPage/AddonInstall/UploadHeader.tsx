import { Button, Spacer } from '@ynput/ayon-react-components'
import AddonManager from './AddonManager'

type Props = {
  type: string
  manageMode: boolean
  isClearDisabled: boolean
  setManageMode: (value: boolean) => void
  setFiles: (value: any) => void
  handleChange: (e: any) => void
}

const UploadHeader: React.FC<Props> = ({
  type = 'addon',
  manageMode,
  isClearDisabled,
  setManageMode,
  setFiles,
  handleChange,
}) => {
  if (manageMode) {
    return (
      <AddonManager
        manageMode={manageMode}
        setManageMode={setManageMode}
      />
    )
  }
  const accept = type === 'addon' ? ['.zip'] : ['*']
  return (
    <>
      <Button onClick={() => setManageMode(true)} label="Manage uploads" />
      <Spacer />
      <Button
        icon="delete"
        onClick={() => setFiles([])}
        label="Clear all"
        disabled={isClearDisabled}
      />
      <Button icon="upload_file" className="upload-button">
        <span>Add {}</span>
        <input
          type="file"
          id="input-file-upload"
          accept={accept.length ? accept.join(',') : undefined}
          multiple
          onChange={handleChange}
        />
      </Button>
    </>
  )
}

export default UploadHeader
