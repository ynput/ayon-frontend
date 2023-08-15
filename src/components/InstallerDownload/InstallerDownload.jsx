import { Icon } from '@ynput/ayon-react-components'
import React from 'react'
import { useGetInstallerListQuery } from '/src/services/installers'
import { toast } from 'react-toastify'
import useLocalStorage from '/src/hooks/useLocalStorage'
import * as Styled from './InstallerDownload.styled'

const InstallerDownload = ({ isSpecial }) => {
  const [installerDownloaded, setInstallerDownloaded] = useLocalStorage(
    'installer-downloaded',
    false,
  )
  const { data: installers } = useGetInstallerListQuery()

  // get operating system of user
  const userPlatform = React.useMemo(() => {
    const userAgent = window.navigator.userAgent
    if (userAgent.indexOf('Win') !== -1) {
      return 'windows'
    } else if (userAgent.indexOf('Linux') !== -1) {
      return 'linux'
    } else if (userAgent.indexOf('Mac') !== -1) {
      return 'darwin'
    } else {
      return 'unknown'
    }
  }, [])

  const handleDownloadClick = async (sources, filename) => {
    // find a source of type === 'server
    const serverSource = sources.find((source) => source.type === 'server')
    const urlSource = sources.find((source) => source.type === 'url')
    if (serverSource || urlSource) {
      const url = serverSource
        ? `/api/desktop/installers/${filename}?token=${localStorage.getItem('accessToken')}`
        : urlSource.url
      // download the file
      // const response = await fetch(url)
      // const blob = await response.blob()
      // const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      // set localStorage
      setInstallerDownloaded(true)
    } else {
      toast.error('URL for installer not found')
    }
  }

  if (isSpecial && installerDownloaded) return null

  return (
    <>
      <Styled.InstallerDownload
        $isSpecial={isSpecial}
        options={installers}
        value={[]}
        valueTemplate={() => (
          <Styled.Value>
            <Icon icon="expand_more" />
            <span>Download Installers</span>
          </Styled.Value>
        )}
        itemTemplate={({ platform, filename, sources }) => (
          <Styled.Item
            $highlight={userPlatform === platform}
            onClick={() => handleDownloadClick(sources, filename)}
          >
            <Icon icon="download" />
            <span>
              {platform === 'darwin' ? 'macOS' : platform} - {filename}
            </span>
          </Styled.Item>
        )}
      />
      {isSpecial && (
        <Styled.CloseButton
          $isSpecial={true}
          icon="close"
          onClick={() => setInstallerDownloaded(true)}
        />
      )}
    </>
  )
}

export default InstallerDownload
