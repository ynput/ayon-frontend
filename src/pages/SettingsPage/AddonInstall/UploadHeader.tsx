import { Button, Spacer } from '@ynput/ayon-react-components'
import AddonManager from './AddonManager'

type Props = {
  type: string
  manager: string
  manageMode: boolean
  isClearDisabled: boolean
  setManageMode: (value: boolean) => void
  setFiles: (value: any) => void
  handleChange: (e: any) => void
}

const UploadHeader: React.FC<Props> = ({
  type = 'addon',
  manager,
  manageMode,
  isClearDisabled,
  setManageMode,
  setFiles,
  handleChange,
}) => {
  if (manager && manageMode) {
    return (
      <AddonManager
        manager={manager}
        manageMode={manageMode}
        setManageMode={setManageMode}
      />
    )
  }
  const accept = type === 'addon' ? ['.zip'] : ['*']
  return (
    <>
      {manager != null && <Button onClick={() => setManageMode(true)} label="Manage uploads" />}
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
