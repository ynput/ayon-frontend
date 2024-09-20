import { useRef, useState } from 'react'
import { Dialog } from '@ynput/ayon-react-components'
import AddonUpload from '@pages/SettingsPage/AddonInstall/AddonUpload'
import { confirmDialog } from 'primereact/confirmdialog'
import { toast } from 'react-toastify'

const AddonDialog = ({ uploadOpen, setUploadOpen, uploadHeader }) => {
  // keep track is an addon was installed
  const [isUploading, setIsUploading] = useState(false)
  const [restartRequired, setRestartRequired] = useState(false)
  const abortController = useRef(new AbortController())

  const handleAddonInstallFinish = () => {
    if (!isUploading) {
      setUploadOpen(false)
      setIsUploading(false)
      return
    }

    confirmDialog({
      header: 'Cancel upload operation',
      message: (
        <>
          <p>This action will stop the files upload from completing.</p>
          <p>Are you sure you want to cancel?</p>
        </>
      ),
      accept: () => {
        toast.error('Upload was cancelled')
        abortController.current.abort()
        abortController.current = new AbortController()
        setUploadOpen(false)
        setIsUploading(false)

        if (restartRequired) {
          setRestartRequired(false)
        }
      },
    })
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
          abortController={abortController.current}
          onClose={handleAddonInstallFinish}
          type={uploadOpen}
          onUploadStateChange={setIsUploading}
          onInstall={(uploadOpen) => uploadOpen === 'addon' && setRestartRequired(true)}
        />
      )}
    </Dialog>
  )
}

export default AddonDialog
