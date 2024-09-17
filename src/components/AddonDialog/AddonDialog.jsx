import { useState } from 'react'
import { Dialog } from '@ynput/ayon-react-components'
import AddonUpload from '@pages/SettingsPage/AddonInstall/AddonUpload'

const AddonDialog = ({ uploadOpen, setUploadOpen, uploadHeader }) => {
  // keep track is an addon was installed
  const [restartRequired, setRestartRequired] = useState(false)
  const abortController = new AbortController()

  const handleAddonInstallFinish = () => {
    abortController.abort();
    if (restartRequired) setRestartRequired(false)
    setUploadOpen(false)
  }
  return (
    <Dialog
      isOpen={!!uploadOpen}
      style={{ width: 400, height: 400, overflow: 'hidden' }}
      header={uploadHeader || 'Upload addon'}
      onClose={handleAddonInstallFinish}
      size="md"
    >
      {uploadOpen && (
        <AddonUpload
          abortController={abortController}
          onClose={handleAddonInstallFinish}
          type={uploadOpen}
          onInstall={(uploadOpen) => uploadOpen === 'addon' && setRestartRequired(true)}
        />
      )}
    </Dialog>
  )
}

export default AddonDialog
