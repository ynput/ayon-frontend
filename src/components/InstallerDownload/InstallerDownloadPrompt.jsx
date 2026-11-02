import React from 'react'
import { useAfterStartup, useLocalStorage } from '@shared/hooks'
import * as Styled from './InstallerDownloadPrompt.styled'
import useGetInstallerDownload from './useGetInstallerDownload'

const InstallerDownloadPrompt = () => {
  const [installersDownloaded, setInstallersDownloaded] = useLocalStorage(
    'installers-downloaded',
    [],
  )

  // a prompt, not worth slowing down the page load for
  const isAfterStartup = useAfterStartup()
  const { directDownload } = useGetInstallerDownload({ skip: !isAfterStartup })

  const downloadFromUrl = (url, filename) => {
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.parentNode.removeChild(link)
    // set localStorage
    setInstallersDownloaded([...installersDownloaded, filename])
  }

  const handleDirectDownload = () => {
    downloadFromUrl(directDownload?.url, directDownload?.filename)
  }

  if (!directDownload) return null
  if (installersDownloaded?.includes(directDownload?.filename)) return null

  return (
    <Styled.Container>
      {directDownload && (
        <Styled.DownloadButton icon={'install_desktop'} onClick={handleDirectDownload}>
          Download launcher
        </Styled.DownloadButton>
      )}

      <Styled.CloseButton
        icon="close"
        onClick={() => setInstallersDownloaded([...installersDownloaded, directDownload.filename])}
      />
    </Styled.Container>
  )
}

export default InstallerDownloadPrompt
